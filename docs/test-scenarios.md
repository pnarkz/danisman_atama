# Test Senaryolari

Bu dokuman, Word belgesinde gecen operasyonel senaryolari test odakli hale getirir.

## Temel Senaryolar

### 1. Sifre ile giris

- Rol bazli uc kullanici ile giris yap:
  - admin
  - danisman
  - ogrenci
- Beklenen sonuc:
  - her kullanici kendi paneline yonlenir
  - token localStorage'a yazilir
  - yetkisiz rota erisimi engellenir

### 2. Yonetici kullanici siler

- Admin panelinden bir ogrenci secilir
- Kullanici silinir
- Beklenen sonuc:
  - `users` tablosundan silinir
  - ogrenci profili silinir
  - tercihleri ve bagli loglari temizlenir
  - varsa onceki kontenjan kullanimi geri acilir

### 3. 40 ogrenci / 9 ogretim uyesi / 1 admin senaryosu

- Test verisi bu dagilimla yuklenir
- Kontenjanlar hesaplanir
- Beklenen sonuc:
  - aktif danismanlar icin dengeli kota olusur
  - sifir kota problemi raporlanir ya da kontrollu ele alinir

### 4. 9. tercih atamasi

- Bir ogrencinin ilk 8 tercihi dolu olacak sekilde veri hazirlanir
- 9. tercih acik kontenjana sahipse ogrenci oraya atanir
- Beklenen sonuc:
  - ogrenci, tercih sirasinda ilk uygun danismana yerlestirilir

### 5. Bir danismanin asiri tercih edilmesi

- Birden fazla ogrenci ayni danismani ust siralarda secer
- Beklenen sonuc:
  - otomatik yerlestirme yalnizca GANO sirasi ile ilerler
  - kota doldugunda bir sonraki aktif tercihe gecilir

### 6. Bos kontenjan senaryosu

- Tercih listesi disinda aktif kontenjanli danisman bulunur
- Beklenen sonuc:
  - ogrenci tercihleriyle yerlestirilemezse fallback ile uygun aktif danismana gecilir

### 7. Danisman donem ortasinda ayrilir

- Danisman pasif duruma alinir
- Beklenen sonuc:
  - yeni teklif gonderemez
  - otomatik yerlestirme listesine girmez
  - mevcut ogrenciler icin yonetici manuel danisman degisikligi yapabilir

### 8. Hoca aktif / pasif durumu

- Bir danisman icin aktiflik durumu degistirilir
- Beklenen sonuc:
  - ogrenci tercih havuzunda yalnizca aktif danismanlar gorunur
  - pasif danisman teklif akisini kullanamaz

### 9. Hoca degistirme senaryosu

- Yonetici panelinden ogrenci ve yeni danisman secilir
- Beklenen sonuc:
  - eski danismanin `current_quota` degeri guncellenir
  - yeni danismanin `current_quota` degeri artar
  - log kaydi olusur

### 10. Sifre degistirme senaryosu

- Kullanici mevcut sifresini girerek yeni sifre belirler
- Beklenen sonuc:
  - mevcut sifre dogrulanir
  - yeni sifre hashlenerek saklanir
  - hatali mevcut sifre ile islem reddedilir

### 11. Tablo tasariminda bolum

- Ogrenci ve danisman profilleri bolum ile iliskilidir
- Beklenen sonuc:
  - admin listelerinde bolum bilgisi gosterilir
  - ogrenci ve danisman panellerinde bolum alani gorunur

### 12. Mail gereksinimi

- Mail gonderimi bu iterasyonda zorunlu kabul edilmez
- Beklenen sonuc:
  - sistem mail olmadan calisir
  - README'de bu maddenin sonraki faz oldugu belirtilir

### 13. Baska bolumlerin senaryosu

- Birden fazla bolum ile veri hazirlanir
- Beklenen sonuc:
  - bolumler veritabaninda bagimsiz tutulur
  - panellerde bolum etiketleri dogru gorunur

## Kontrol Listesi

- Giris akisi calisiyor mu?
- Merkezi atama sadece GANO sirasi ile mi ilerliyor?
- Pasif danisman kurali tum UI ve API akislarinda uygulanmis mi?
- Kullanici silme veritabanina tutarli sekilde yansiyor mu?
- Manuel danisman degisikligi kota ve loglari guncelliyor mu?
- README kurulum, deploy ve test senaryolarini dogru anlatiyor mu?
