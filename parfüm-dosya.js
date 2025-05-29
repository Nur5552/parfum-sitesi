import React, { useState } from "react";
import axios from "axios";

function App() {
  const [type, setType] = useState("");
  const [clothing, setClothing] = useState("");
  const [season, setSeason] = useState("");
  const [allergy, setAllergy] = useState("");
  const [parfums, setParfums] = useState([]);
  const [error, setError] = useState("");

  const getParfums = async () => {
    try {
      setError(""); 
      const res = await axios.get("http://localhost:5000/api/parfums", {
        params: { type, clothing, season, allergy },
      });
      setParfums(res.data);
    } catch (err) {
      console.error("Veri çekilemedi:", err);
      setError("Parfüm önerileri alınırken bir hata oluştu.");
    }
  };

  return (
    <div className="App">
      <h2>Parfüm Seçici</h2>

      
      <div>
        <label>Koku Türü:</label>
        <button onClick={() => setType("Odunsu")}>Odunsu</button>
        <button onClick={() => setType("Çiçeksi")}>Çiçeksi</button>
      </div>

      
      <div>
        <label>Kıyafet Türü:</label>
        <button onClick={() => setClothing("Kumaş")}>Kumaş</button>
        <button onClick={() => setClothing("Yünlü")}>Yünlü</button>
      </div>

      
      <div>
        <label>Mevsim:</label>
        <button onClick={() => setSeason("Yazlık")}>Yazlık</button>
        <button onClick={() => setSeason("Kışlık")}>Kışlık</button>
        <button onClick={() => setSeason("İlkbaharlık")}>İlkbaharlık</button>
        <button onClick={() => setSeason("Sonbaharlık")}>Sonbaharlık</button>
      </div>

      
      <div>
        <label>Alerji:</label>
        <input
          type="text"
          value={allergy}
          onChange={(e) => setAllergy(e.target.value)}
          placeholder="Alerjin varsa gir..."
        />
      </div>

      
      <button onClick={getParfums}>Parfüm Öner</button>

      
      {error && <p style={{ color: "red" }}>{error}</p>}

      
      <ul>
        {parfums.length > 0 ? (
          parfums.map((p, idx) => <li key={idx}>{p.name}</li>)
        ) : (
          <li>Henüz bir öneri yok.</li>
        )}
      </ul>
    </div>
  );
}

export default App;