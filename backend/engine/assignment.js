const { getDb } = require('../db/database');

function groupFacultyIndexes(facultyCount) {
    const highCount = facultyCount === 1 ? 1 : Math.max(1, Math.floor(facultyCount * 0.25));
    const lowCount = facultyCount <= 3 ? 0 : Math.max(1, Math.floor(facultyCount * 0.25));
    const midStart = highCount;
    const midEnd = Math.max(midStart, facultyCount - lowCount);

    return {
        high: Array.from({ length: highCount }, (_, index) => index),
        mid: Array.from({ length: midEnd - midStart }, (_, index) => index + midStart),
        low: Array.from({ length: facultyCount - midEnd }, (_, index) => index + midEnd)
    };
}

function calculateTargetQuotas(facultyList, totalTarget) {
    const sortedFaculty = [...facultyList].sort((left, right) => left.id - right.id);
    const quotaMap = {};

    if (sortedFaculty.length === 0) {
        return quotaMap;
    }

    sortedFaculty.forEach((faculty) => {
        quotaMap[faculty.id] = faculty.current_quota;
    });

    let remaining = totalTarget - sortedFaculty.reduce((sum, faculty) => sum + faculty.current_quota, 0);
    if (remaining <= 0) {
        return quotaMap;
    }

    if (totalTarget >= sortedFaculty.length) {
        for (const faculty of sortedFaculty) {
            if (quotaMap[faculty.id] === 0 && remaining > 0) {
                quotaMap[faculty.id] += 1;
                remaining -= 1;
            }
        }
    }

    const { high, mid, low } = groupFacultyIndexes(sortedFaculty.length);
    const averageQuota = Math.max(1, Math.round(totalTarget / sortedFaculty.length));
    const preferredTargets = sortedFaculty.map((faculty, index) => {
        if (high.includes(index)) {
            return Math.max(quotaMap[faculty.id], averageQuota + 1);
        }
        if (low.includes(index)) {
            return Math.max(quotaMap[faculty.id], Math.max(1, averageQuota - 1));
        }
        return Math.max(quotaMap[faculty.id], averageQuota);
    });

    const preferenceOrder = [...high, ...mid, ...low];
    for (const index of preferenceOrder) {
        while (remaining > 0 && quotaMap[sortedFaculty[index].id] < preferredTargets[index]) {
            quotaMap[sortedFaculty[index].id] += 1;
            remaining -= 1;
        }
    }

    while (remaining > 0) {
        const ranked = [...sortedFaculty].sort((left, right) => {
            const leftRemaining = quotaMap[left.id] - left.current_quota;
            const rightRemaining = quotaMap[right.id] - right.current_quota;
            if (leftRemaining !== rightRemaining) {
                return leftRemaining - rightRemaining;
            }
            if (quotaMap[left.id] !== quotaMap[right.id]) {
                return quotaMap[left.id] - quotaMap[right.id];
            }
            return left.id - right.id;
        });

        for (const faculty of ranked) {
            if (remaining === 0) {
                break;
            }
            quotaMap[faculty.id] += 1;
            remaining -= 1;
        }
    }

    return quotaMap;
}

function calculateQuotas() {
    const db = getDb();
    const activeFaculty = db.prepare('SELECT id, current_quota FROM faculty WHERE is_active = 1 ORDER BY id ASC').all();
    const inactiveFaculty = db.prepare('SELECT id, current_quota FROM faculty WHERE is_active = 0').all();
    const unassignedStudents = db.prepare('SELECT COUNT(*) as c FROM students WHERE is_assigned = 0').get().c;
    const currentAssignments = activeFaculty.reduce((sum, faculty) => sum + faculty.current_quota, 0);
    const managedStudents = currentAssignments + unassignedStudents;

    if (activeFaculty.length === 0) {
        return { error: 'Kontenjan hesaplamak için en az bir aktif danışman gerekli.' };
    }

    const quotaMap = calculateTargetQuotas(activeFaculty, managedStudents);
    const updateQuota = db.prepare('UPDATE faculty SET base_quota = ? WHERE id = ?');

    db.transaction(() => {
        activeFaculty.forEach((faculty) => {
            updateQuota.run(quotaMap[faculty.id] || faculty.current_quota, faculty.id);
        });

        inactiveFaculty.forEach((faculty) => {
            updateQuota.run(faculty.current_quota, faculty.id);
        });
    })();

    return {
        message: 'Kontenjanlar aktif danışmanlara dengeli şekilde dağıtıldı.',
        totalStudents: managedStudents,
        unassignedStudents,
        totalFaculty: activeFaculty.length,
        quotas: activeFaculty.map((faculty) => ({
            faculty_id: faculty.id,
            base_quota: quotaMap[faculty.id] || faculty.current_quota,
            current_quota: faculty.current_quota
        }))
    };
}

function runAssignment() {
    const db = getDb();
    
    const stats = {
        totalStudents: 0,
        placedByPreference: 0,
        placedRandomly: 0,
        unplaced: 0
    };

    const transaction = db.transaction(() => {
        // 1. Get all unassigned students sorted only by GANO.
        const students = db.prepare('SELECT id, gano FROM students WHERE is_assigned = 0 ORDER BY gano DESC, id ASC').all();
        stats.totalStudents = students.length;
        
        if (students.length === 0) return stats;

        // Fetch quotas only for active faculty
        const facultyList = db.prepare('SELECT id, base_quota, current_quota FROM faculty WHERE is_active = 1').all();
        if (facultyList.length === 0) {
            stats.unplaced = students.length;
            return stats;
        }
        
        // Create a quota map
        const quotas = {};
        facultyList.forEach(f => {
            quotas[f.id] = { base: f.base_quota, current: f.current_quota };
        });

        // Loop over students
        const updateStudent = db.prepare('UPDATE students SET is_assigned = 1, assigned_faculty_id = ? WHERE id = ?');
        const getPrefs = db.prepare('SELECT faculty_id FROM preferences WHERE student_id = ? ORDER BY rank ASC');

        for (const student of students) {
            const prefs = getPrefs.all(student.id);
            let placed = false;
            
            // Try to place according to preferences
            for (const pref of prefs) {
                const fid = pref.faculty_id;
                if (quotas[fid] && quotas[fid].current < quotas[fid].base) {
                    quotas[fid].current += 1;
                    updateStudent.run(fid, student.id);
                    placed = true;
                    stats.placedByPreference++;
                    
                    db.prepare('INSERT INTO assignment_logs (student_id, faculty_id, action, details) VALUES (?, ?, ?, ?)')
                      .run(student.id, fid, 'GALE_SHAPLEY_ASSIGN', 'Tercihine gore atandi (GANO: ' + student.gano + ')');
                    break;
                }
            }
            
            if (!placed) {
                // Fallback among active faculty with the highest remaining quota.
                const emptyFaculty = Object.entries(quotas)
                    .filter(([, quota]) => quota.current < quota.base)
                    .sort((left, right) => {
                        const leftRemaining = left[1].base - left[1].current;
                        const rightRemaining = right[1].base - right[1].current;

                        if (leftRemaining !== rightRemaining) {
                            return rightRemaining - leftRemaining;
                        }

                        if (left[1].current !== right[1].current) {
                            return left[1].current - right[1].current;
                        }

                        return parseInt(left[0], 10) - parseInt(right[0], 10);
                    })[0];
                
                if (emptyFaculty) {
                    const fid = parseInt(emptyFaculty[0], 10);
                    quotas[fid].current += 1;
                    updateStudent.run(fid, student.id);
                    placed = true;
                    stats.placedRandomly++;
                    
                    db.prepare('INSERT INTO assignment_logs (student_id, faculty_id, action, details) VALUES (?, ?, ?, ?)')
                      .run(student.id, fid, 'FALLBACK_ASSIGN', 'Bos kontenjana rastgele atandi (GANO: ' + student.gano + ')');
                } else {
                    stats.unplaced++;
                }
            }
        }
        
        // Update DB quotas
        const updateQuota = db.prepare('UPDATE faculty SET current_quota = ? WHERE id = ?');
        for (const [fid, q] of Object.entries(quotas)) {
            updateQuota.run(q.current, fid);
        }
    });

    transaction();
    return stats;
}

function runSimulation() {
    console.log("Simülasyon başlatılıyor...");
    const quotas = calculateQuotas();
    console.log(quotas);
    const results = runAssignment();
    console.log("Atama Sonuçları: ", results);
}

module.exports = {
    calculateQuotas,
    runAssignment,
    runSimulation
};
