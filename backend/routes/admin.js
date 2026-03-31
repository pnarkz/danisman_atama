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

module.exports = router;
