const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'danisman-atama-secret-key-2024';

// JWT doğrulama middleware
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Yetkilendirme tokeni gerekli.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    }
}

// Rol bazlı yetkilendirme middleware
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
        }
        next();
    };
}

module.exports = { authenticate, authorize, JWT_SECRET };
