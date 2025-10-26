// API para gestión de sensores
const express = require('express');
const { getDatabase } = require('../database/manager');
const router = express.Router();

// Obtener TODOS los sensores del sistema
router.get('/sensores', async (req, res) => {
  try {
    const db = getDatabase();
    const sensores = await db.obtenerTodosLosSensores();
    res.json(sensores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los sensores de un nodo
router.get('/nodos/:nodoId/sensores', async (req, res) => {
  try {
    const db = getDatabase();
    const sensores = await db.obtenerSensoresPorNodo(req.params.nodoId);
    res.json(sensores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo sensor
router.post('/sensores', async (req, res) => {
  try {
    const db = getDatabase();
    const id = await db.insertarSensor(req.body);
    res.json({ id, mensaje: 'Sensor creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar sensor
router.put('/sensores/:id', async (req, res) => {
  try {
    const db = getDatabase();
    await db.actualizarSensor(req.params.id, req.body);
    res.json({ mensaje: 'Sensor actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar sensor
router.delete('/sensores/:id', async (req, res) => {
  try {
    const db = getDatabase();
    await db.eliminarSensor(req.params.id);
    res.json({ mensaje: 'Sensor eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener lecturas de un sensor
router.get('/sensores/:id/lecturas', async (req, res) => {
  try {
    const db = getDatabase();
    const limite = req.query.limite || 100;
    const lecturas = await db.obtenerLecturasRecientes(req.params.id, limite);
    res.json(lecturas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;