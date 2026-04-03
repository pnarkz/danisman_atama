# Mimari ve Akis Dokumani

## Genel Bakis

Danisman Atama Sistemi, ogrenci tercihleri ile danisman tekliflerini ayni akista yoneten bir web uygulamasidir.
Sistem, merkezi yerlestirme asamasinda yalnizca GANO siralamasini otomatik kriter olarak kullanir.
Dogrudan danisman teklifi kabul edilirse ogrenci merkezi yerlestirme sirasindan cikar.

## Temel Is Kurallari

- Merkezi yerlestirmede ogrenciler `GANO DESC` sirasina gore islenir.
- Tercih listesi, ogrencinin hangi aktif danismanlara hangi sirada bakilacagini belirler.
- Danisman manuel teklif gonderebilir; teklif kabul edilirse kontenjan aninda guncellenir.
- Pasif durumdaki danisman yeni teklif gonderemez ve merkezi yerlestirme listesinde kullanilmaz.
- Kontenjan dagitimi aktif danismanlar uzerinden hesaplanir.
- Dagitim, ortalama kota etrafinda dengeli bir profil olusturur:
  - yaklasik `%25` `x + 1`
  - yaklasik `%50` `x`
  - yaklasik `%25` `x - 1`
- Ogrenci sayisi aktif danisman sayisindan az ise "her danismana en az bir ogrenci" kosulu matematiksel olarak saglanamaz; bu durum operasyonel risk olarak ele alinmalidir.

## ER Diyagrami

```mermaid
erDiagram
    departments ||--o{ students : "barindirir"
    departments ||--o{ faculty : "barindirir"
    users ||--|| students : "ogrenci profili"
    users ||--|| faculty : "danisman profili"
    students ||--o{ preferences : "tercih verir"
    faculty ||--o{ preferences : "tercih listesinde yer alir"
    students ||--o{ pre_assignments : "teklif alir"
    faculty ||--o{ pre_assignments : "teklif gonderir"
    students ||--o{ assignment_logs : "loglanir"
    faculty ||--o{ assignment_logs : "loglanir"

    users {
        int id PK
        string email
        string password_hash
        string role
        string full_name
        datetime created_at
    }

    students {
        int id PK
        int user_id FK
        float gano
        int department_id FK
        int entry_year
        int is_assigned
        int assigned_faculty_id FK
    }

    faculty {
        int id PK
        int user_id FK
        int department_id FK
        string expertise_keywords
        int is_active
        int base_quota
        int current_quota
    }

    preferences {
        int id PK
        int student_id FK
        int faculty_id FK
        int rank
        datetime created_at
    }

    pre_assignments {
        int id PK
        int student_id FK
        int faculty_id FK
        string status
        datetime created_at
    }

    assignment_logs {
        int id PK
        int student_id FK
        int faculty_id FK
        string action
        string details
        datetime timestamp
    }

    departments {
        int id PK
        string name
    }
```

## Sequence Diyagrami: Sifre ile Giris

```mermaid
sequenceDiagram
    participant U as Kullanici
    participant F as Frontend
    participant B as Backend
    participant DB as SQLite

    U->>F: E-posta ve sifre girer
    F->>B: POST /api/auth/login
    B->>DB: users tablosundan kullaniciyi getir
    DB-->>B: Kullanici ve parola hash
    B->>B: bcrypt ile sifreyi dogrula
    B-->>F: JWT + user payload
    F->>F: token ve user bilgisini localStorage'a yaz
    F-->>U: Rol bazli panele yonlendir
```

## Sequence Diyagrami: Ogrenci Tercih Kaydi

```mermaid
sequenceDiagram
    participant O as Ogrenci
    participant F as Frontend
    participant B as Backend
    participant DB as SQLite

    O->>F: Tercih listesini duzenler
    F->>B: POST /api/students/preferences
    B->>DB: Ogrencinin atanmamis oldugunu kontrol et
    DB-->>B: Ogrenci durumu
    B->>DB: Eski tercihleri sil
    B->>DB: Yeni tercihleri sirali olarak yaz
    B->>DB: assignment_logs kaydi olustur
    B-->>F: Basarili yanit
    F-->>O: Tercih listesini guncel goster
```

## Sequence Diyagrami: Danisman Dogrudan Teklif Akisi

```mermaid
sequenceDiagram
    participant D as Danisman
    participant F as Frontend
    participant B as Backend
    participant DB as SQLite
    participant O as Ogrenci

    D->>F: Ogrenci icin teklif gonderir
    F->>B: POST /api/faculty/invite
    B->>DB: Danisman aktif mi ve kota uygun mu kontrol et
    B->>DB: pre_assignments kaydi olustur
    B-->>F: Teklif olusturuldu
    O->>F: Teklifi kabul eder
    F->>B: POST /api/students/invitations/:id/respond
    B->>DB: Ogrenciyi ilgili danismana ata
    B->>DB: current_quota guncelle
    B->>DB: Diger bekleyen teklifleri kapat
    B-->>F: Atama kesinlesti
```

## Operasyonel Notlar

- Danisman pasife alindiginda yeni teklif gonderemez.
- Pasif danismanin mevcut ogrencileri sistemde kalir; yeniden atama yonetici panelinden yapilir.
- Kullanici silme isleminde bagli veriler kontrollu sekilde temizlenir.
- Danisman silinecekse once bagli ogrenciler ve bekleyen teklifler temizlenmelidir.
