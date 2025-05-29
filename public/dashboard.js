document.getElementById('parfumForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = {
    cinsiyet: document.getElementById('cinsiyet').value,
    koku: document.getElementById('koku').value,
    kiyafet: document.getElementById('kıyafet').value,
    mevsim: document.getElementById('mevsim').value,
    alerji: document.getElementById('alerji').value,
  };

  const response = await fetch('http://localhost:5000/api/oneri', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  const data = await response.json();
  const sonucDiv = document.getElementById('sonuc');

  if (data.link) {
    sonucDiv.innerHTML = `
      <h3>Önerilen Parfüm:</h3>
      <p>${data.parfum}</p>
      <a href="${data.link}" target="_blank">Trendyol’da Görüntüle</a>
    `;
  } else {
    sonucDiv.textContent = 'Bir öneri alınamadı.';
  }
  document.getElementById('parfumForm')

});
