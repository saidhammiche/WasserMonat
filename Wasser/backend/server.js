const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sql = require("mssql");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Configuration SQL Server
const dbConfig = {
  user: "emonitor",
  password: "ELfG-2014",
  server: "20.52.39.176",
  database: "MRS_BI",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// -------------------------
// GET: récupérer toutes les données ou filtrer par année/mois
// -------------------------
app.get("/api/wassermonat", async (req, res) => {
  const { jahr, monat } = req.query;

  try {
    const pool = await sql.connect(dbConfig);
    let query = `SELECT * FROM WasserMonat`;
    const conditions = [];

    if (jahr) conditions.push(`Jahr = ${jahr}`);
    if (monat) conditions.push(`Monat = ${monat}`);
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Abrufen der Daten" });
  }
});

// -------------------------
// PUT: modifier une ligne par WasserMonatID
// -------------------------
app.put("/api/wassermonat/:id", async (req, res) => {
  const { id } = req.params;
  const { "Wasser-Zählerstand": zaehlerstand, Wasserverbrauch } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    await pool
      .request()
      .input("zaehlerstand", sql.Int, zaehlerstand)
      .input("verbrauch", sql.Int, Wasserverbrauch)
      .input("id", sql.Int, id)
      .query(
        `UPDATE WasserMonat 
         SET [Wasser-Zählerstand] = @zaehlerstand, Wasserverbrauch = @verbrauch 
         WHERE WasserMonatID = @id`
      );
    res.json({ message: "Daten erfolgreich geändert" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Speichern der Daten" });
  }
});

// -------------------------
// POST: ajouter une nouvelle ligne
// -------------------------
app.post("/api/wassermonat", async (req, res) => {
  const { Jahr, Monat, "Wasser-Zählerstand": zaehlerstand, Wasserverbrauch } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    await pool
      .request()
      .input("jahr", sql.Int, Jahr)
      .input("monat", sql.Int, Monat)
      .input("zaehlerstand", sql.Int, zaehlerstand)
      .input("verbrauch", sql.Int, Wasserverbrauch)
      .query(
        `INSERT INTO WasserMonat (Jahr, Monat, [Wasser-Zählerstand], Wasserverbrauch) 
         VALUES (@jahr, @monat, @zaehlerstand, @verbrauch)`
      );
    res.json({ message: "Neue Daten erfolgreich hinzugefügt" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Hinzufügen der Daten" });
  }
});

// -------------------------
// Server écoute
// -------------------------
app.listen(PORT, () =>
  console.log(`Server läuft auf Port ${PORT}`)
);
