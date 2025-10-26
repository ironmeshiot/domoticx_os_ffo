// API para gestión de definiciones de sensores (biblioteca técnica)
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/manager');

const db = getDatabase();

// GET /api/sensores-definiciones - Obtener todas las definiciones
router.get('/', async (req, res) => {
  try {
    const definiciones = await db.obtenerDefinicionesSensores();
    res.json(definiciones);
  } catch (error) {
    console.error('Error obteniendo definiciones de sensores:', error);
    res.status(500).json({ error: 'Error obteniendo definiciones de sensores' });
  }
});

// GET /api/sensores-definiciones/:id - Obtener definición específica
router.get('/:id', async (req, res) => {
  try {
    const definicion = await db.obtenerDefinicionSensorPorId(req.params.id);
    if (definicion) {
      res.json(definicion);
    } else {
      res.status(404).json({ error: 'Definición no encontrada' });
    }
  } catch (error) {
    console.error('Error obteniendo definición de sensor:', error);
    res.status(500).json({ error: 'Error obteniendo definición de sensor' });
  }
});

// POST /api/sensores-definiciones - Crear nueva definición
router.post('/', async (req, res) => {
  try {
    const id = await db.insertarDefinicionSensor(req.body);
    const definicion = await db.obtenerDefinicionSensorPorId(id);
    res.status(201).json(definicion);
  } catch (error) {
    console.error('Error creando definición de sensor:', error);
    res.status(500).json({ error: 'Error creando definición de sensor' });
  }
});

// PUT /api/sensores-definiciones/:id - Actualizar definición
router.put('/:id', async (req, res) => {
  try {
    await db.actualizarDefinicionSensor(req.params.id, req.body);
    const definicion = await db.obtenerDefinicionSensorPorId(req.params.id);
    res.json(definicion);
  } catch (error) {
    console.error('Error actualizando definición de sensor:', error);
    res.status(500).json({ error: 'Error actualizando definición de sensor' });
  }
});

// DELETE /api/sensores-definiciones/:id - Eliminar definición
router.delete('/:id', async (req, res) => {
  try {
    await db.eliminarDefinicionSensor(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando definición de sensor:', error);
    if (error.message.includes('asignaciones activas')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error eliminando definición de sensor' });
    }
  }
});

module.exports = router;
