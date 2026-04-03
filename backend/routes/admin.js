const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');
const engine = require('../engine/assignment');

const router = express.Router();

router.post('/calculate-quotas', authenticate, authorize('admin'), (req, res) => {
    try {
        const result = engine.calculateQuotas();
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

router.post('/run-assignment', authenticate, authorize('admin'), (req, res) => {
    try {
        const result = engine.runAssignment();
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

router.get('/results', authenticate, authorize('admin'), (req, res) => {
    try {
        const db = getDb();
        const results = db.prepare(`
            SELECT 
                s.id as student_id,
                us.full_name as student_name,
                s.gano,
                ds.name as student_department,
                f.id as faculty_id,
                uf.full_name as faculty_name
            FROM students s
            JOIN users us ON s.user_id = us.id
            LEFT JOIN departments ds ON s.department_id = ds.id
            LEFT JOIN faculty f ON s.assigned_faculty_id = f.id
            LEFT JOIN users uf ON f.user_id = uf.id
            ORDER BY s.gano DESC
        `).all();
        
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

router.post('/force-assign', authenticate, authorize('admin'), (req, res) => {
    try {
        const { student_id, faculty_id } = req.body;
        if (!student_id || !faculty_id) return res.status(400).json({ error: 'student_id ve faculty_id gerekli.' });
        
        const db = getDb();
        const targetFaculty = db.prepare('SELECT id, is_active FROM faculty WHERE id = ?').get(faculty_id);

        if (!targetFaculty) {
            return res.status(404).json({ error: 'Danışman bulunamadı.' });
        }

        if (targetFaculty.is_active !== 1) {
            return res.status(400).json({ error: 'Pasif durumdaki danışmana manuel atama yapılamaz.' });
        }
        
        db.transaction(() => {
            // Check current assignment
            const student = db.prepare('SELECT assigned_faculty_id FROM students WHERE id = ?').get(student_id);
            if (student && student.assigned_faculty_id) {
                // decrement old faculty quota
                db.prepare('UPDATE faculty SET current_quota = current_quota - 1 WHERE id = ?').run(student.assigned_faculty_id);
            }
            
            // Assign new
            db.prepare('UPDATE students SET is_assigned = 1, assigned_faculty_id = ? WHERE id = ?').run(faculty_id, student_id);
            db.prepare('UPDATE faculty SET current_quota = current_quota + 1 WHERE id = ?').run(faculty_id);
            
            db.prepare('INSERT INTO assignment_logs (student_id, faculty_id, action, details) VALUES (?, ?, ?, ?)')
              .run(student_id, faculty_id, 'FORCE_ASSIGN', 'Admin tarafindan manuel atama yapildi.');
        })();
        
        res.json({ message: 'Zorunlu atama başarılı.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

router.get('/export', authenticate, authorize('admin'), (req, res) => {
    try {
        const db = getDb();
        const results = db.prepare(`
            SELECT 
                us.full_name as student_name,
                us.email as student_email,
                s.gano,
                uf.full_name as assigned_faculty_name
            FROM students s
            JOIN users us ON s.user_id = us.id
            LEFT JOIN faculty f ON s.assigned_faculty_id = f.id
            LEFT JOIN users uf ON f.user_id = uf.id
        `).all();
        
        // Simple CSV generation
        const header = 'Ogrenci Adi,Ogrenci Email,GANO,Atanan Hoca\n';
        const rows = results.map(r => `"${r.student_name}","${r.student_email}",${r.gano},"${r.assigned_faculty_name || 'ATANMADI'}"`).join('\n');
        
        res.header('Content-Type', 'text/csv');
        res.attachment('atama_sonuclari.csv');
        res.send(header + rows);
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

router.get('/logs', authenticate, authorize('admin'), (req, res) => {
    try {
        const db = getDb();
        const logs = db.prepare(`
            SELECT l.*, 
                   us.full_name as student_name, 
                   uf.full_name as faculty_name
            FROM assignment_logs l
            LEFT JOIN students s ON l.student_id = s.id
            LEFT JOIN users us ON s.user_id = us.id
            LEFT JOIN faculty f ON l.faculty_id = f.id
            LEFT JOIN users uf ON f.user_id = uf.id
            ORDER BY l.timestamp DESC
        `).all();
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

router.get('/get_dashboard_data', authenticate, authorize('admin'), (req, res) => {
    try {
        const db = getDb();
        const studentCount = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
        const assignedStudentCount = db.prepare('SELECT COUNT(*) as c FROM students WHERE is_assigned = 1').get().c;
        const facultyCount = db.prepare('SELECT COUNT(*) as c FROM faculty').get().c;
        res.json({ studentCount, assignedStudentCount, facultyCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

router.get('/users', authenticate, authorize('admin'), (req, res) => {
    try {
        const db = getDb();
        const users = db.prepare(`
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.role,
                d.name as department_name,
                f.is_active,
                s.gano,
                s.entry_year,
                assigned_u.full_name as assigned_faculty_name
            FROM users u
            LEFT JOIN students s ON s.user_id = u.id
            LEFT JOIN faculty f ON f.user_id = u.id
            LEFT JOIN departments d ON d.id = COALESCE(s.department_id, f.department_id)
            LEFT JOIN faculty assigned_f ON assigned_f.id = s.assigned_faculty_id
            LEFT JOIN users assigned_u ON assigned_u.id = assigned_f.user_id
            ORDER BY
                CASE u.role
                    WHEN 'admin' THEN 0
                    WHEN 'hoca' THEN 1
                    ELSE 2
                END,
                u.full_name ASC
        `).all();

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

router.get('/faculty-overview', authenticate, authorize('admin'), (req, res) => {
    try {
        const db = getDb();
        const faculty = db.prepare(`
            SELECT
                f.id,
                u.full_name,
                u.email,
                d.name as department_name,
                f.expertise_keywords,
                f.base_quota,
                f.current_quota,
                f.is_active
            FROM faculty f
            JOIN users u ON u.id = f.user_id
            JOIN departments d ON d.id = f.department_id
            ORDER BY u.full_name ASC
        `).all();

        res.json(faculty);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

router.patch('/faculty/:id/status', authenticate, authorize('admin'), (req, res) => {
    try {
        const db = getDb();
        const facultyId = parseInt(req.params.id, 10);
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ error: 'is_active alanı boolean olmalıdır.' });
        }

        const faculty = db.prepare('SELECT id FROM faculty WHERE id = ?').get(facultyId);
        if (!faculty) {
            return res.status(404).json({ error: 'Danışman bulunamadı.' });
        }

        db.prepare('UPDATE faculty SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, facultyId);
        db.prepare('INSERT INTO assignment_logs (faculty_id, action, details) VALUES (?, ?, ?)')
            .run(facultyId, is_active ? 'FACULTY_ACTIVATED' : 'FACULTY_DEACTIVATED', 'Danışman durumu yönetici tarafından güncellendi.');

        res.json({ message: `Danışman durumu ${is_active ? 'aktif' : 'pasif'} olarak güncellendi.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

router.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
    try {
        const db = getDb();
        const userId = parseInt(req.params.id, 10);
        const user = db.prepare('SELECT id, role, full_name FROM users WHERE id = ?').get(userId);

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        if (user.role === 'admin') {
            const adminCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "admin"').get().c;
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Sistemde en az bir yönetici kalmalıdır.' });
            }
        }

        db.transaction(() => {
            if (user.role === 'ogrenci') {
                const student = db.prepare('SELECT id, assigned_faculty_id FROM students WHERE user_id = ?').get(user.id);
                if (student?.assigned_faculty_id) {
                    db.prepare('UPDATE faculty SET current_quota = CASE WHEN current_quota > 0 THEN current_quota - 1 ELSE 0 END WHERE id = ?')
                        .run(student.assigned_faculty_id);
                }

                if (student) {
                    db.prepare('DELETE FROM preferences WHERE student_id = ?').run(student.id);
                    db.prepare('DELETE FROM pre_assignments WHERE student_id = ?').run(student.id);
                    db.prepare('DELETE FROM assignment_logs WHERE student_id = ?').run(student.id);
                    db.prepare('DELETE FROM students WHERE id = ?').run(student.id);
                }
            }

            if (user.role === 'hoca') {
                const faculty = db.prepare('SELECT id FROM faculty WHERE user_id = ?').get(user.id);
                if (faculty) {
                    const assignedCount = db.prepare('SELECT COUNT(*) as c FROM students WHERE assigned_faculty_id = ?').get(faculty.id).c;
                    const pendingInvites = db.prepare('SELECT COUNT(*) as c FROM pre_assignments WHERE faculty_id = ? AND status = "pending"').get(faculty.id).c;

                    if (assignedCount > 0 || pendingInvites > 0) {
                        throw new Error('Bu danışman silinmeden önce aktif öğrencileri ve bekleyen teklifleri temizlenmelidir.');
                    }

                    db.prepare('DELETE FROM pre_assignments WHERE faculty_id = ?').run(faculty.id);
                    db.prepare('DELETE FROM assignment_logs WHERE faculty_id = ?').run(faculty.id);
                    db.prepare('DELETE FROM faculty WHERE id = ?').run(faculty.id);
                }
            }

            db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
        })();

        res.json({ message: `${user.full_name} sistemden kaldırıldı.` });
    } catch (err) {
        console.error(err);
        const message = err.message === 'Bu danışman silinmeden önce aktif öğrencileri ve bekleyen teklifleri temizlenmelidir.'
            ? err.message
            : 'Sunucu hatası.';
        res.status(message === 'Sunucu hatası.' ? 500 : 400).json({ error: message });
    }
});

module.exports = router;
