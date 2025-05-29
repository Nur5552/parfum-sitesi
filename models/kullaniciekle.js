const mongoose = require('mongoose');

const kullaniciSchema = new mongoose.Schema({
  kullaniciAdi: { type: String, unique: true, required: true },
  sifre: { type: String, required: true }
});

module.exports = mongoose.model('Kullanici', kullaniciSchema);