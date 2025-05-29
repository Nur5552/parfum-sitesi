require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB bağlantısı başarılı!');
  console.log('Bağlantı URL:', process.env.MONGODB_URI);
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.log('Koleksiyonları listelerken hata:', err);
    } else {
      console.log('Mevcut koleksiyonlar:', collections.map(c => c.name));
    }
    mongoose.connection.close();
  });
})
.catch(err => {
  console.log('MongoDB bağlantı hatası:', err);
  process.exit(1);
}); 