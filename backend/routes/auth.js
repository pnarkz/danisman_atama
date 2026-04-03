const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
    try {
        const { email, password, role, full_name, gano, department_id, entry_year, expertise_keywords } = req.body;
        const db = getDb();

        if (!email || !password || !role || !full_name) {
            return res.status(400).json({ error: 'email, password, role ve full_name zorunludur.' });
        }

        if (!['admin', 'hoca', 'ogrenci'].includes(role)) {
            return res.status(400).json({ error: 'Geçersiz rol. (admin/hoca/ogrenci)' });
        }

        // Check if email exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı.' });
        }

        const password_hash = bcrypt.hashSync(password, 10);

        const insertUser = db.prepare(
            'INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)'
        );
        const result = insertUser.run(email, password_hash, role, full_name);
        const userId = result.lastInsertRowid;

        // Create role-specific profile
        if (role === 'ogrenci') {
            db.prepare(
                'INSERT INTO students (user_id, gano, department_id, entry_year) VALUES (?, ?, ?, ?)'
            ).run(userId, gano || 0, department_id || 1, entry_year || new Date().getFullYear());
        } else if (role === 'hoca') {
            db.prepare(
                'INSERT INTO faculty (user_id, department_id, expertise_keywords) VALUES (?, ?, ?)'
            ).run(userId, department_id || 1, expertise_keywords || '');
        }

        const token = jwt.sign({ id: userId, email, role, full_name }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ message: 'Kayıt başarılı.', token, user: { id: userId, email, role, full_name } });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDb();

        if (!email || !password) {
            return res.status(400).json({ error: 'E-posta ve şifre gerekli.' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
        }

        const valid = bcrypt.compareSync(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Get role-specific info
        let profileInfo = {};
        if (user.role === 'ogrenci') {
            profileInfo = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id) || {};
        } else if (user.role === 'hoca') {
            profileInfo = db.prepare('SELECT * FROM faculty WHERE user_id = ?').get(user.id) || {};
        }

        res.json({
            message: 'Giriş başarılı.',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                profile: profileInfo
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const db = getDb();

        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre zorunludur.' });
        }

        if (new_password.length < 8) {
            return res.status(400).json({ error: 'Yeni şifre en az 8 karakter olmalıdır.' });
        }

        const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const valid = bcrypt.compareSync(current_password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Mevcut şifre doğrulanamadı.' });
        }

        const passwordHash = bcrypt.hashSync(new_password, 10);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.user.id);

        res.json({ message: 'Şifreniz başarıyla güncellendi.' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
