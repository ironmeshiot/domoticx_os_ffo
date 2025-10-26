// API para gestión de definiciones de actuadores (biblioteca técnica)
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/manager');

const db = getDatabase();

// GET /api/actuadores-definiciones - Obtener todas las definiciones
router.get('/', async (req, res) => {
  try {
    const definiciones = await db.obtenerDefinicionesActuadores();
    res.json(definiciones);
  } catch (error) {
    console.error('Error obteniendo definiciones de actuadores:', error);
    res.status(500).json({ error: 'Error obteniendo definiciones de actuadores' });
  }
});

// GET /api/actuadores-definiciones/:id - Obtener definición específica
router.get('/:id', async (req, res) => {
  try {
    const definicion = await db.obtenerDefinicionActuadorPorId(req.params.id);
    if (definicion) {
      res.json(definicion);
    } else {
      res.status(404).json({ error: 'Definición no encontrada' });
    }
  } catch (error) {
    console.error('Error obteniendo definición de actuador:', error);
    res.status(500).json({ error: 'Error obteniendo definición de actuador' });
  }
});

// POST /api/actuadores-definiciones - Crear nueva definición
router.post('/', async (req, res) => {
  try {
    const id = await db.insertarDefinicionActuador(req.body);
    const definicion = await db.obtenerDefinicionActuadorPorId(id);
    res.status(201).json(definicion);
  } catch (error) {
    console.error('Error creando definición de actuador:', error);
    res.status(500).json({ error: 'Error creando definición de actuador' });
  }
});

// PUT /api/actuadores-definiciones/:id - Actualizar definición
router.put('/:id', async (req, res) => {
  try {
    await db.actualizarDefinicionActuador(req.params.id, req.body);
    const definicion = await db.obtenerDefinicionActuadorPorId(req.params.id);
    res.json(definicion);
  } catch (error) {
    console.error('Error actualizando definición de actuador:', error);
    res.status(500).json({ error: 'Error actualizando definición de actuador' });
  }
});

// DELETE /api/actuadores-definiciones/:id - Eliminar definición
router.delete('/:id', async (req, res) => {
  try {
    await db.eliminarDefinicionActuador(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando definición de actuador:', error);
    if (error.message.includes('asignaciones activas')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Error eliminando definición de actuador' });
    }
  }
});

module.exports = router;
