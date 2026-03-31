const { getDb } = require('../db/database');

function calculateQuotas() {
    const db = getDb();
    const studentsCount = db.prepare('SELECT COUNT(*) as c FROM students WHERE is_assigned = 0').get().c;
    const facultyCount = db.prepare('SELECT COUNT(*) as c FROM faculty').get().c;
    
    if (facultyCount === 0) return { error: 'Sistemde hoca bulunmuyor.' };
    
    // Yüksek kontenjanı bir taban kontenjan olarak belirle
    const baseQuota = Math.floor(studentsCount / facultyCount);
    const extra = studentsCount % facultyCount; 
    
    db.transaction(() => {
        // Kontenjanlari guncelle (herkese baseQuota)
        db.prepare('UPDATE faculty SET base_quota = ?').run(baseQuota);
        
        // Eger tam bolunmuyorsa bazi hocalara fazladan 1 kontenjan ver 
        // (Siralamasi rastgele veya id siralamasina gore)
        const facultyIds = db.prepare('SELECT id FROM faculty').all();
        const updateExtra = db.prepare('UPDATE faculty SET base_quota = base_quota + 1 WHERE id = ?');
        
        for(let i=0; i < extra; i++) {
            updateExtra.run(facultyIds[i].id);
        }
    })();
    
    return { 
        message: `Kontenjanlar hesaplandı. Taban: ${baseQuota}, Toplam ekstra eklenecek hoca: ${extra}`,
        baseQuota,
        totalStudents: studentsCount,
        totalFaculty: facultyCount
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
        // 1. Get all unassigned students sorted by GANO DESC, Entry Year ASC
        const students = db.prepare('SELECT id, gano FROM students WHERE is_assigned = 0 ORDER BY gano DESC, entry_year ASC').all();
        stats.totalStudents = students.length;
        
        if (students.length === 0) return stats;

        // Fetch quotas
        const facultyList = db.prepare('SELECT id, base_quota, current_quota FROM faculty').all();
        
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
                // Try random/fallback placement among faculty with empty spots
                const emptyFaculty = Object.keys(quotas).find(k => quotas[k].current < quotas[k].base);
                
                if (emptyFaculty) {
                    const fid = parseInt(emptyFaculty);
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
