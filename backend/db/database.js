const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'danisman_atama.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

let db;

function hasColumn(tableName, columnName) {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns.some((column) => column.name === columnName);
}

function migrateDb() {
    if (!hasColumn('faculty', 'is_active')) {
        db.prepare('ALTER TABLE faculty ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1').run();
    }
}

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initializeDb();
    }
    return db;
}

function initializeDb() {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);
    migrateDb();

    // Check if seed data is needed
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
        const seed = fs.readFileSync(SEED_PATH, 'utf8');
        db.exec(seed);

        // Hash passwords properly for seed data
        const bcrypt = require('bcryptjs');

        const adminHash = bcrypt.hashSync('admin123', 10);
        const hocaHash = bcrypt.hashSync('hoca123', 10);
        const ogrenciHash = bcrypt.hashSync('ogrenci123', 10);

        db.prepare('UPDATE users SET password_hash = ? WHERE role = ?').run(adminHash, 'admin');
        db.prepare('UPDATE users SET password_hash = ? WHERE role = ?').run(hocaHash, 'hoca');
        db.prepare('UPDATE users SET password_hash = ? WHERE role = ?').run(ogrenciHash, 'ogrenci');

        console.log('✅ Veritabanı seed verileri yüklendi.');
    }
}

module.exports = { getDb };
