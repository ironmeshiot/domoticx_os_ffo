// API REST para configuración de widgets del dashboard
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const WIDGETS_FILE = path.join(__dirname, '../../data/widgets_config.json');

// Cargar configuración
router.get('/', (req, res) => {
  fs.readFile(WIDGETS_FILE, 'utf8', (err, data) => {
    if (err) return res.json({ widgets: [] });
    try {
      const config = JSON.parse(data);
      res.json(config);
    } catch {
      res.json({ widgets: [] });
    }
  });
});

// Guardar configuración
router.post('/', (req, res) => {
  const { widgets } = req.body;
  fs.writeFile(WIDGETS_FILE, JSON.stringify({ widgets }), err => {
    if (err) return res.status(500).json({ error: 'No se pudo guardar' });
    res.json({ ok: true });
  });
});

module.exports = router;
