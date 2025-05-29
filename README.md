# Parfüm Öneri Sistemi

Bu proje, kullanıcıların tercihlerine göre parfüm önerileri sunan bir web uygulamasıdır.

## Özellikler

- Kullanıcı kaydı ve girişi
- Parfüm önerileri
- Şifre sıfırlama sistemi
- Kişiselleştirilmiş parfüm önerileri
- Mevsim ve kumaş bazlı öneri sistemi

## Teknolojiler

- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Nodemailer

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/Nur5552/parfum-sitesi
cd parfum-sitesi
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyasını oluşturun:
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_uri
SITE_URL=your_site_url
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

4. Uygulamayı başlatın:
```bash
npm start
```

## API Endpoints

- `POST /api/kayit` - Yeni kullanıcı kaydı
- `POST /api/giris` - Kullanıcı girişi
- `POST /api/oneri` - Parfüm önerisi alma
- `POST /api/sifremi-unuttum` - Şifre sıfırlama isteği
- `POST /api/sifre-sifirla` - Yeni şifre belirleme

## Güvenlik

- Rate limiting
- Input validation
- Password hashing
- XSS protection
- CORS configuration
