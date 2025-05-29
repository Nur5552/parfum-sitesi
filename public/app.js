document.getElementById('notForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const baslik = document.getElementById('baslik').value;
  const icerik = document.getElementById('icerik').value;

  const response = await fetch('/api/notlar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ baslik, icerik })
  });

  const data = await response.json();
  alert(data.mesaj || data.hata);
});
