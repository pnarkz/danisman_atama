-- Danışman Atama Sistemi — Mock Data (Seed)

-- Bölümler
INSERT OR IGNORE INTO departments (id, name) VALUES
(1, 'Bilgisayar Mühendisliği'),
(2, 'Elektrik-Elektronik Mühendisliği'),
(3, 'Yazılım Mühendisliği');

-- Admin kullanıcı (şifre: admin123 → bcrypt hash)
INSERT OR IGNORE INTO users (id, email, password_hash, role, full_name) VALUES
(1, 'admin@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'admin', 'Sistem Yöneticisi');

-- Hocalar (şifre: hoca123)
INSERT OR IGNORE INTO users (id, email, password_hash, role, full_name) VALUES
(2,  'ahmet.yilmaz@ankara.edu.tr',    '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'hoca', 'Prof. Dr. Ahmet Yılmaz'),
(3,  'ayse.demir@ankara.edu.tr',      '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'hoca', 'Doç. Dr. Ayşe Demir'),
(4,  'mehmet.kaya@ankara.edu.tr',     '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'hoca', 'Dr. Öğr. Üyesi Mehmet Kaya'),
(5,  'fatma.ozturk@ankara.edu.tr',    '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'hoca', 'Prof. Dr. Fatma Öztürk'),
(6,  'ali.celik@ankara.edu.tr',       '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'hoca', 'Doç. Dr. Ali Çelik'),
(7,  'zeynep.arslan@ankara.edu.tr',   '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'hoca', 'Dr. Öğr. Üyesi Zeynep Arslan'),
(8,  'hasan.sahin@ankara.edu.tr',     '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'hoca', 'Prof. Dr. Hasan Şahin'),
(9,  'elif.korkmaz@ankara.edu.tr',    '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'hoca', 'Doç. Dr. Elif Korkmaz'),
(10, 'murat.tas@ankara.edu.tr',       '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'hoca', 'Dr. Öğr. Üyesi Murat Taş'),
(11, 'selin.yildiz@ankara.edu.tr',    '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'hoca', 'Prof. Dr. Selin Yıldız');

-- Hoca profilleri
INSERT OR IGNORE INTO faculty (id, user_id, department_id, expertise_keywords, base_quota, current_quota) VALUES
(1,  2,  1, 'Yapay Zeka, Makine Öğrenmesi, Derin Öğrenme', 0, 0),
(2,  3,  1, 'Veri Madenciliği, Büyük Veri, NLP', 0, 0),
(3,  4,  1, 'Bilgisayar Ağları, Siber Güvenlik', 0, 0),
(4,  5,  2, 'Sinyal İşleme, Görüntü İşleme', 0, 0),
(5,  6,  2, 'Gömülü Sistemler, IoT', 0, 0),
(6,  7,  2, 'Kontrol Sistemleri, Robotik', 0, 0),
(7,  8,  3, 'Yazılım Mimarisi, Tasarım Kalıpları', 0, 0),
(8,  9,  3, 'Web Teknolojileri, Bulut Bilişim', 0, 0),
(9,  10, 3, 'Mobil Uygulama Geliştirme, DevOps', 0, 0),
(10, 11, 1, 'Bilgisayar Grafikleri, Oyun Geliştirme', 0, 0);

-- Öğrenciler (50 öğrenci, şifre: ogrenci123)
INSERT OR IGNORE INTO users (id, email, password_hash, role, full_name) VALUES
(12, 'ogrenci01@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Ali Veli'),
(13, 'ogrenci02@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Fatma Nur'),
(14, 'ogrenci03@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Mehmet Can'),
(15, 'ogrenci04@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Zeynep Su'),
(16, 'ogrenci05@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Burak Yılmaz'),
(17, 'ogrenci06@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Elif Şen'),
(18, 'ogrenci07@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Emre Demir'),
(19, 'ogrenci08@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Sude Kara'),
(20, 'ogrenci09@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Kaan Öztürk'),
(21, 'ogrenci10@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Derin Aksoy'),
(22, 'ogrenci11@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'İrem Çetin'),
(23, 'ogrenci12@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Yusuf Aydın'),
(24, 'ogrenci13@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Ceren Tekin'),
(25, 'ogrenci14@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Oğuz Erdem'),
(26, 'ogrenci15@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Deniz Koç'),
(27, 'ogrenci16@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Buse Güneş'),
(28, 'ogrenci17@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Arda Polat'),
(29, 'ogrenci18@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Aslı Kurtuluş'),
(30, 'ogrenci19@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Serkan Bulut'),
(31, 'ogrenci20@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Merve Tunç'),
(32, 'ogrenci21@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Onur Bayrak'),
(33, 'ogrenci22@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Gizem Ateş'),
(34, 'ogrenci23@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Tolga Sezer'),
(35, 'ogrenci24@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Pınar Doğan'),
(36, 'ogrenci25@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Furkan Acar'),
(37, 'ogrenci26@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Esra Kurt'),
(38, 'ogrenci27@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Baran Güler'),
(39, 'ogrenci28@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Dilara Çelik'),
(40, 'ogrenci29@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Umut Karaca'),
(41, 'ogrenci30@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Nisa Bozkurt'),
(42, 'ogrenci31@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Selim Erdoğan'),
(43, 'ogrenci32@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Hira Yavuz'),
(44, 'ogrenci33@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Efe Özkan'),
(45, 'ogrenci34@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Cemre Aktaş'),
(46, 'ogrenci35@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Mert Yalçın'),
(47, 'ogrenci36@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Tuğçe Demirtaş'),
(48, 'ogrenci37@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Batuhan Kılıç'),
(49, 'ogrenci38@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Damla Ünal'),
(50, 'ogrenci39@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Kerem Sevim'),
(51, 'ogrenci40@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Ezgi Toprak'),
(52, 'ogrenci41@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Barış Çınar'),
(53, 'ogrenci42@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Simge Aydoğan'),
(54, 'ogrenci43@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Uğur Bayram'),
(55, 'ogrenci44@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Cansu Yılmazer'),
(56, 'ogrenci45@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Doruk Ergen'),
(57, 'ogrenci46@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Nehir Duman'),
(58, 'ogrenci47@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Alp Eren Koçak'),
(59, 'ogrenci48@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Yağmur Sarı'),
(60, 'ogrenci49@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Berke Aslan'),
(61, 'ogrenci50@ankara.edu.tr', '$2b$10$XQCg1z4YB1ZKqE1y1X5kQuGqFwR8M0VfVbQLm0z5m5m5m5m5m5m5m', 'ogrenci', 'Hazal Çakır');

-- Öğrenci profilleri (çeşitli GANO ve giriş yılları)
INSERT OR IGNORE INTO students (id, user_id, gano, department_id, entry_year) VALUES
(1,  12, 3.82, 1, 2021), (2,  13, 3.55, 1, 2021), (3,  14, 2.98, 1, 2022),
(4,  15, 3.71, 1, 2020), (5,  16, 2.45, 1, 2022), (6,  17, 3.90, 1, 2021),
(7,  18, 3.12, 1, 2023), (8,  19, 2.78, 2, 2021), (9,  20, 3.65, 2, 2020),
(10, 21, 3.33, 2, 2022), (11, 22, 2.90, 2, 2021), (12, 23, 3.48, 2, 2023),
(13, 24, 3.75, 2, 2020), (14, 25, 2.60, 2, 2022), (15, 26, 3.20, 3, 2021),
(16, 27, 3.95, 3, 2020), (17, 28, 2.85, 3, 2023), (18, 29, 3.40, 3, 2021),
(19, 30, 3.10, 3, 2022), (20, 31, 2.70, 3, 2021), (21, 32, 3.60, 1, 2020),
(22, 33, 3.05, 1, 2022), (23, 34, 2.50, 1, 2023), (24, 35, 3.88, 1, 2021),
(25, 36, 3.42, 2, 2020), (26, 37, 2.95, 2, 2022), (27, 38, 3.28, 2, 2021),
(28, 39, 3.78, 3, 2020), (29, 40, 2.55, 3, 2023), (30, 41, 3.15, 3, 2021),
(31, 42, 3.50, 1, 2022), (32, 43, 2.80, 1, 2021), (33, 44, 3.68, 1, 2020),
(34, 45, 3.22, 2, 2023), (35, 46, 2.92, 2, 2021), (36, 47, 3.58, 2, 2020),
(37, 48, 3.02, 3, 2022), (38, 49, 3.85, 3, 2021), (39, 50, 2.65, 3, 2023),
(40, 51, 3.38, 1, 2020), (41, 52, 3.72, 1, 2021), (42, 53, 2.88, 2, 2022),
(43, 54, 3.45, 2, 2020), (44, 55, 3.18, 3, 2023), (45, 56, 3.62, 3, 2021),
(46, 57, 2.75, 1, 2022), (47, 58, 3.92, 1, 2020), (48, 59, 3.30, 2, 2021),
(49, 60, 2.82, 3, 2023), (50, 61, 3.55, 3, 2020);
