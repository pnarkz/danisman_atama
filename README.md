# Danışman Atama Sistemi (DAS) 🎓

Ankara Üniversitesi ve diğer akademik kurumlar için tasarlanmış, **iki aşamalı (Öncelikli Eşleşme + Merkezi Yerleştirme)** adil, şeffaf ve modern bir "Danışman - Öğrenci Atama" web uygulamasıdır. 

Sistem, öğrencilerin GANO'larına (Not Ortalaması) ve giriş yıllarına göre hoca kontenjanlarına adil bir şekilde yerleştirilmesini temel alır. Proje, arka uçta Node.js & Express, ön uçta ise asenkron API'lerle donatılmış bir React (Glassmorphism UI) uygulamasıdır. 🚀

---

## 🌟 Öne Çıkan Özellikler

### 1. İki Kademeli Atama Algoritması (Gale-Shapley Entegrasyonu)
DAS, klasik manuel danışman atama yükünü sıfıra indirir:
-   **Aşama 1 (Öncelikli Atama):** Hocalar sisteme giriş yaparak öğrenciler arasında GANO/Yıl bazlı arama yapabilir. Projesine dahil etmek istediği öğrenciye "Doğrudan Teklif" gönderir. Öğrenci kabul ettiği an sistem kontenjandan otomatik olarak 1 kişi düşer.
-   **Aşama 2 (Merkezi ÖSYM Tipi Yerleştirme):** Ön ataması gerçekleşmeyen (boştaki) tüm öğrenciler, kendi belirledikleri "Tercih Havuzu" sıralamasına göre Gale-Shapley (Stabil Eşleşme) algoritmasına tabi tutulur. Yüksek not ortalamasına sahip öğrenci önceliklidir!
-   **Fallback (Kurtarıcı Eşleşme):** Hiçbir tercihine yerleşemeyen öğrenciler, kontenjanı dolmamış hocalara sistem tarafından rastgele atanır. **Kimse dışarıda kalmaz!**

### 2. Rol Bazlı Gelişmiş Paneller (Role-Based Access)
-   👨‍💻 **Admin (Yönetici) Modülü:** Tüm kontenjan sınırlarını bir tıkla (Taban Kontenjan: *(Öğrenci Sayısı / Hoca Sayısı) ± %10 tölerans*) hesaplar. Merkezi Atama butonuna basarak tüm atamaları saniyeler içinde simüle eder/gerçekleştirir. Olan biteni "Sistem Logları" tablosundan saniye saniye izleyip raporları Excel (.CSV) formatında bilgisayara indirebilir.
-   👨‍🏫 **Hoca (Danışman) Modülü:** Kendisine atanan danışmanlık listesini eşzamanlı görüntüler. Boşta olan öğrencileri GANO değerlerine göre filtreler ve onlara "Özel Danışmanlık Teklifi" gönderebilir.
-   🎓 **Öğrenci Modülü:** Üniversitenin renklerine sadık kalınarak tasarlanmış "Sepet" mantığı. Havuzdaki hocaları inceleyip, sepetine atar ve yukarı-aşağı ok tuşlarıyla kendi 1., 2., 3. tercihlerini sıralayabilir. Hocadan gelen "Ön atama" daveti var ise panelin en üstünde "Kabul Et / Reddet" mekanizmasını kullanır.

### 3. Modern & Responsif Tasarım (Glassmorphism & UX)
Sistem **React** tabanlıdır ve standart, sıkıcı panellerin yerine günümüz modern web tasarım standartları olan "Cam Efekti (Glassmorphism)" teknolojisiyle yazılmıştır:
- Dinamik sayfa geçişleri,
- Ankara Üniversitesi lacivert/kırmızı marka renklerine entegre "Dark Mode" arayüzü,
- Anlık bildirimler ve görsel doğrulama sinyalleri (Success/Error Alerts).

---

## 🛠 Kullanılan Teknolojiler (Tech Stack)

### Backend (Arka Plan)
-   **Node.js & Express.js:** Hızlı ve ölçeklenebilir asenkron API sunucusu.
-   **SQLite (`better-sqlite3`):** Kurulum gerektirmeyen, hızlı, relation tabanlı (PostgreSQL'e migrate edilmeye hazır) SQL veritabanı.
-   **JWT (JSON Web Token) & bcryptjs:** Endüstri standardı şifreleme ve yetki kontrolü. CORS korumalı.
-   **Mimari:** Toplam 7 tabloluk (Users, Students, Faculty, Preferences, Pre_Assignments, Departments, Logs) kurumsal veritabanı tasarımı modeli.

### Frontend (Ön Yüz)
-   **React 18:** Güçlü DOM yönetimi.
-   **React Router DOM:** Rol bazlı güvenli sayfalandırma (Protected Routes).
-   **Axios:** Hızlı API iletişimi, Interceptor tabanlı Token yönetimi.
-   **Lucide React:** Modern ve keskin SVG ikon takımları.

---

## 🚀 Kurulum ve Çalıştırma Rehberi

Projeyi kendi ortamınızda test etmek veya geliştirmek için aşağıdaki adımları sırasıyla uygulayın.

### Gereksinimler
- Node.js (v18.0.0 veya üzeri)
- Git

### 1. Repoyu Klonlayın
\`\`\`bash
git clone https://github.com/KULLANICI_ADINIZ/danisman_atama.git
cd danisman_atama
\`\`\`

### 2. Backend Sunucusunu Ayağa Kaldırın
Backend klasörüne girip paketleri yükledikten sonra sunucuyu başlatıyoruz. 
> *Not: Sistem başladığı an `schema.sql` ve `seed.sql` devreye girer. Yani otomatik olarak test etmeniz için size 50 öğrenci ve 10 hoca verisi yaratılır!*

\`\`\`bash
cd backend
npm install
npm start
\`\`\`
> **Başarılı Çıktı:** `✅ Backend sunucusu http://localhost:3000 adresinde çalışıyor.`

### 3. Frontend Geliştirme Sunucusunu Ayağa Kaldırın
Yeni bir terminal penceresinde projeye ana dizinden tekrar girin:
\`\`\`bash
cd frontend_cra
npm install
npm start
\`\`\`
Sistem otomatik olarak tarayıcıda `http://localhost:5173` veya `http://localhost:3000` adresinde açılacaktır.

---

## 🔑 Test Hesapları (Demo Login)

Projeyi ayağa kaldırdıktan sonra aşağıdaki hesaplarla rolleri anında test edebilirsiniz:

| Rol (Kullanıcı Tipi) | E-posta Adresi | Şifre |
| :--- | :--- | :--- |
| **Sistem Yöneticisi (Admin)** | `admin@ankara.edu.tr` | `admin123` |
| **Danışman (Örnek Hoca)** | `faculty1@ankara.edu.tr` | `password123` |
| **Danışman (Örnek Hoca 2)** | `faculty2@ankara.edu.tr` | `password123` |
| **Öğrenci (Örnek Öğrenci)** | `student1@ankara.edu.tr` | `password123` |
| **Öğrenci (Örnek Öğrenci 5)** | `student5@ankara.edu.tr` | `password123` |

*(Diğer öğrenciler için student2, student3... , hocalar için faculty3, faculty4... şeklinde giriş yapabilirsiniz).*

---

## 📄 Lisans
Bu proje akademik ve eğitimsel amaçlarla açık kaynaklı olarak geliştirilmiştir. Hiçbir ticari amaç gütmemektedir. (MIT License)

**🎉 İyi Çalışmalar ve Başarılar!**
