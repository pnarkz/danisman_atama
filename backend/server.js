const express = require('express');
const cors = require('cors');
const { getDb } = require('./db/database');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const facultyRoutes = require('./routes/faculty');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Database connection implicitly
getDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);

// General Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Beklenmeyen bir hata oluştu.' });
});

app.listen(PORT, () => {
    console.log(`✅ Backend sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});
