const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Kullanici = require('./models/Kullanici');
const app = express();

// Production environment check
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(express.json());
app.use(cors({
  origin: isProduction 
    ? ['https://lenaworld.com.tr', 'https://www.lenaworld.com.tr']
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Serve static files
app.use(express.static('public'));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// MongoDB connection
const MONGODB_URI = isProduction
  ? process.env.MONGODB_URI
  : 'mongodb://localhost:27017/parfum_db';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB bağlantısı başarılı!');
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.log('Koleksiyonları listelerken hata:', err);
    } else {
      console.log('Mevcut koleksiyonlar:', collections.map(c => c.name));
    }
  });
})
.catch(err => console.log('MongoDB bağlantı hatası:', err));


const validateInput = (req, res, next) => {
  const { kullaniciAdi, sifre } = req.body;
  
  
  if (!kullaniciAdi || !sifre) {
    return res.status(400).json({ hata: 'Kullanıcı adı ve şifre gereklidir!' });
  }

 
  if (kullaniciAdi.length < 3 || kullaniciAdi.length > 30) {
    return res.status(400).json({ hata: 'Kullanıcı adı 3-30 karakter arasında olmalıdır!' });
  }

 
  if (!/^[a-zA-Z0-9_-]+$/.test(kullaniciAdi)) {
    return res.status(400).json({ hata: 'Kullanıcı adı sadece harf, rakam, alt çizgi ve tire içerebilir!' });
  }

  if (sifre.length < 6 || sifre.length > 50) {
    return res.status(400).json({ hata: 'Şifre 6-50 karakter arasında olmalıdır!' });
  }

  
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/.test(sifre)) {
    return res.status(400).json({ 
      hata: 'Şifre en az bir harf ve bir rakam içermelidir!' 
    });
  }

  next();
};


app.use((err, req, res, next) => {
  console.error('Hata:', err);
  res.status(500).json({ 
    basarili: false, 
    hata: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.' 
  });
});


const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // IP başına maksimum istek
});

app.use(limiter);


const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 5, // IP başına maksimum 5 başarısız deneme
  message: { 
    hata: 'Çok fazla başarısız giriş denemesi. Lütfen 1 saat sonra tekrar deneyin.' 
  }
});


app.post('/api/kayit', validateInput, async (req, res) => {
  try {
    const { kullaniciAdi, sifre } = req.body;
    
    console.log('Kayıt isteği alındı:', { kullaniciAdi });
    
    
    const mevcutKullanici = await Kullanici.findOne({ 
      kullaniciAdi: { $regex: new RegExp('^' + kullaniciAdi + '$', 'i') }
    });
    
    if (mevcutKullanici) {
      console.log('Kullanıcı zaten mevcut:', kullaniciAdi);
      return res.status(400).json({ hata: 'Bu kullanıcı adı zaten alınmış!' });
    }

   
    const hashedSifre = await bcrypt.hash(sifre, 10);
    
    const yeniKullanici = new Kullanici({
      kullaniciAdi: kullaniciAdi.toLowerCase(), // Kullanıcı adını küçük harfe çevir
      sifre: hashedSifre
    });
    
    await yeniKullanici.save();
    console.log('Yeni kullanıcı kaydedildi:', kullaniciAdi);
    res.status(201).json({ basarili: true, mesaj: 'Kayıt başarılı!' });
  } catch (err) {
    console.error('Kayıt hatası:', err);
    res.status(500).json({ basarili: false, hata: 'Sunucu hatası!' });
  }
});


app.post('/api/giris', loginLimiter, validateInput, async (req, res, next) => {
  try {
    const { kullaniciAdi, sifre } = req.body;
    
    console.log('Giriş denemesi:', { kullaniciAdi });
    
    const kullanici = await Kullanici.findOne({ 
      kullaniciAdi: { $regex: new RegExp('^' + kullaniciAdi + '$', 'i') }
    });

    if (!kullanici) {
      return res.status(401).json({ 
        basarili: false, 
        hata: 'Kullanıcı adı veya şifre hatalı!' 
      });
    }

    const sifreDogruMu = await bcrypt.compare(sifre, kullanici.sifre);
    if (!sifreDogruMu) {
      return res.status(401).json({ 
        basarili: false, 
        hata: 'Kullanıcı adı veya şifre hatalı!' 
      });
    }

    
    console.log('Giriş başarılı:', kullaniciAdi);
    
    // Session veya token oluşturma işlemleri buraya eklenebilir
    
    res.json({ 
      basarili: true, 
      mesaj: 'Giriş başarılı!',
      kullaniciAdi: kullanici.kullaniciAdi
    });
  } catch (err) {
    console.error('Giriş hatası:', err);
    next(err);
  }
});


app.post('/api/oneri', async (req, res) => {
  try {
    const { cinsiyet, koku, mevsim, kumas, alerji } = req.body;

    // Input validation
    if (!cinsiyet || !koku || !mevsim || !kumas) {
      return res.status(400).json({ 
        basarili: false, 
        hata: 'Cinsiyet, koku, mevsim ve kumaş tercihi zorunludur!' 
      });
    }

    
    let yogunluk = "";
    if (mevsim === "yaz") {
      yogunluk = "hafif ve ferah";
    } else if (mevsim === "kış") {
      yogunluk = "yoğun ve kalıcı";
    } else if (mevsim === "ilkbahar") {
      yogunluk = "çiçeksi ve taze";
    } else {
      yogunluk = "odunsu ve baharatlı";
    }

    
    let kumasUyumu = "";
    if (kumas === "pamuk") {
      kumasUyumu = "hafif ve doğal kokular";
    } else if (kumas === "ipek") {
      kumasUyumu = "zarif ve narin kokular";
    } else if (kumas === "deri") {
      kumasUyumu = "güçlü ve kalıcı kokular";
    } else if (kumas === "kadife") {
      kumasUyumu = "sıcak ve yoğun kokular";
    }

    
    let oneriler = [];

   
    if (cinsiyet === "kadin") {
      if (koku === "çiçeksi") {
        if (alerji && alerji.toLowerCase().includes('çiçek')) {
          oneriler.push({
            parfum: "Jo Malone Wood Sage & Sea Salt",
            link: "https://www.trendyol.com/sr?q=Jo+Malone+Wood+Sage+Sea+Salt",
            aciklama: "Alerjiniz nedeniyle çiçeksi yerine deniz ve odunsu notalar içeren bir alternatif.",
            gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/jo-malone-london_wood-sage-sea-salt-cologne_variant.jpg"
          });
          oneriler.push({
            parfum: "Maison Margiela Sailing Day",
            link: "https://www.trendyol.com/sr?q=Maison+Margiela+Sailing+Day",
            aciklama: "Taze deniz esintisi ve odunsu notaların ferah birleşimi.",
            gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/maison-margiela_replica-sailing-day_variant.jpg"
          });
        } else {
          oneriler.push({
            parfum: "Marc Jacobs Daisy",
            link: "https://www.trendyol.com/sr?q=Marc+Jacobs+Daisy",
            aciklama: "Taze ve romantik çiçek notaları ile bahar esintisi.",
            gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/marc-jacobs_daisy-eau-de-toilette_variant.jpg"
          });
          oneriler.push({
            parfum: "Chanel Chance Eau Tendre",
            link: "https://www.trendyol.com/sr?q=Chanel+Chance+Eau+Tendre",
            aciklama: "Zarif çiçek ve meyve notalarının hassas dengesi.",
            gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/chanel_chance-eau-tendre_variant.jpg"
          });
        }
      } else if (koku === "meyve") {
        oneriler.push({
          parfum: "Dolce & Gabbana Light Blue",
          link: "https://www.trendyol.com/sr?q=Dolce+Gabbana+Light+Blue",
          aciklama: "Sicilya limonunun tazeliği ile Akdeniz meyvelerinin muhteşem uyumu.",
          gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/dolce-gabbana_light-blue_variant.jpg"
        });
        oneriler.push({
          parfum: "Jo Malone Nectarine Blossom & Honey",
          link: "https://www.trendyol.com/sr?q=Jo+Malone+Nectarine+Blossom+Honey",
          aciklama: "Tatlı nektar ve bal notalarının meyve çiçekleriyle buluşması.",
          gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/jo-malone_nectarine-blossom-honey_variant.jpg"
        });
      } else if (koku === "vanilya") {
        oneriler.push({
          parfum: "YSL Black Opium",
          link: "https://www.trendyol.com/sr?q=YSL+Black+Opium",
          aciklama: "Vanilya ve kahve notalarının baştan çıkarıcı birleşimi.",
          gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/ysl_black-opium_variant.jpg"
        });
        oneriler.push({
          parfum: "Kayali Vanilla 28",
          link: "https://www.trendyol.com/sr?q=Kayali+Vanilla+28",
          aciklama: "Sıcak vanilya ve amber notalarının lüks yorumu.",
          gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/kayali_vanilla-28_variant.jpg"
        });
      }
    } else if (cinsiyet === "erkek") {
      if (koku === "odunsu") {
        oneriler.push({
          parfum: "Tom Ford Oud Wood",
          link: "https://www.trendyol.com/sr?q=Tom+Ford+Oud+Wood",
          aciklama: "Egzotik odunsu notalar ve nadir bulunan oud esansı.",
          gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/tom-ford_oud-wood_variant.jpg"
        });
        oneriler.push({
          parfum: "Maison Francis Kurkdjian Baccarat Rouge 540",
          link: "https://www.trendyol.com/sr?q=Maison+Francis+Kurkdjian+Baccarat+Rouge+540",
          aciklama: "Sofistike odunsu notalar ve amber harmanı.",
          gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/maison-francis-kurkdjian_baccarat-rouge-540_variant.jpg"
        });
      }
    }

   
    if (oneriler.length < 2) {
      oneriler.push({
        parfum: "Chanel No.5",
        link: "https://www.trendyol.com/sr?q=Chanel+No+5",
        aciklama: "Klasik ve zamansız bir seçim.",
        gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/chanel_n5_variant.jpg"
      });
      oneriler.push({
        parfum: "Dior Sauvage",
        link: "https://www.trendyol.com/sr?q=Dior+Sauvage",
        aciklama: "Modern ve karizmatik bir klasik.",
        gorsel: "https://cdn.shopify.com/s/files/1/0282/5850/products/dior_sauvage_variant.jpg"
      });
    }

    
    oneriler = oneriler.map(oneri => ({
      ...oneri,
      aciklama: `${oneri.aciklama} ${yogunluk.charAt(0).toUpperCase() + yogunluk.slice(1)} bir parfüm olduğundan ${kumasUyumu} tercih edilmiştir.`
    }));

    res.json({ 
      basarili: true, 
      oneriler 
    });
  } catch (err) {
    console.error('Öneri hatası:', err);
    res.status(500).json({ basarili: false, hata: 'Sunucu hatası!' });
  }
});


const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Şifre sıfırlama token şeması
const sifreSifirlamaSchema = new mongoose.Schema({
  email: String,
  token: String,
  sonKullanmaTarihi: Date
});

const SifreSifirlama = mongoose.model('SifreSifirlama', sifreSifirlamaSchema);

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/api/sifremi-unuttum', async (req, res) => {
  try {
    const { email } = req.body;

    // Kullanıcıyı e-posta ile bul
    const kullanici = await Kullanici.findOne({ email });
    if (!kullanici) {
      return res.status(404).json({ 
        basarili: false, 
        hata: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.' 
      });
    }

    
    const token = crypto.randomBytes(32).toString('hex');
    const sonKullanmaTarihi = new Date();
    sonKullanmaTarihi.setHours(sonKullanmaTarihi.getHours() + 1); // 1 saat geçerli

    // Varolan token'ı sil ve yenisini kaydet
    await SifreSifirlama.findOneAndDelete({ email });
    await new SifreSifirlama({
      email,
      token,
      sonKullanmaTarihi
    }).save();

    const sifirlamaLinki = `${process.env.SITE_URL}/sifre-sifirlama.html?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Şifre Sıfırlama',
      html: `
        <h2>Şifre Sıfırlama İsteği</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
        <a href="${sifirlamaLinki}">${sifirlamaLinki}</a>
        <p>Bu link 1 saat süreyle geçerlidir.</p>
        <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      basarili: true, 
      mesaj: 'Şifre sıfırlama linki e-posta adresinize gönderildi.' 
    });

  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    res.status(500).json({ 
      basarili: false, 
      hata: 'Şifre sıfırlama işlemi sırasında bir hata oluştu.' 
    });
  }
});


app.post('/api/sifre-sifirla', async (req, res) => {
  try {
    const { token, yeniSifre } = req.body;

    // Token'ı kontrol et
    const sifreSifirlama = await SifreSifirlama.findOne({
      token,
      sonKullanmaTarihi: { $gt: new Date() }
    });

    if (!sifreSifirlama) {
      return res.status(400).json({ 
        basarili: false, 
        hata: 'Geçersiz veya süresi dolmuş token.' 
      });
    }

    
    const hashedSifre = await bcrypt.hash(yeniSifre, 10);

    // Kullanıcının şifresini güncelle
    await Kullanici.findOneAndUpdate(
      { email: sifreSifirlama.email },
      { sifre: hashedSifre }
    );

    
    await SifreSifirlama.deleteOne({ token });

    res.json({ 
      basarili: true, 
      mesaj: 'Şifreniz başarıyla güncellendi.' 
    });

  } catch (error) {
    console.error('Şifre güncelleme hatası:', error);
    res.status(500).json({ 
      basarili: false, 
      hata: 'Şifre güncelleme işlemi sırasında bir hata oluştu.' 
    });
  }
});


const startServer = (port) => {
  try {
    app.listen(port, () => {
      console.log(`Sunucu ${port} portunda çalışıyor.`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`${port} portu kullanımda, ${port + 1} portu deneniyor...`);
        startServer(port + 1);
      } else {
        console.error('Sunucu başlatma hatası:', err);
      }
    });
  } catch (err) {
    console.error('Beklenmeyen hata:', err);
  }
};

const PORT = process.env.PORT || 5000;
startServer(PORT);
