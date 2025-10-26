// API para gestión de asignaciones de sensores (instancias físicas)
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/manager');

const db = getDatabase();

// GET /api/sensor-asignaciones - Obtener todas las asignaciones
router.get('/', async (req, res) => {
  try {
    const asignaciones = await db.obtenerTodasLasAsignacionesSensores();
    res.json(asignaciones);
  } catch (error) {
    console.error('Error obteniendo asignaciones de sensores:', error);
    res.status(500).json({ error: 'Error obteniendo asignaciones de sensores' });
  }
});

// GET /api/sensor-asignaciones/nodo/:nodoId - Obtener asignaciones de un nodo
router.get('/nodo/:nodoId', async (req, res) => {
  try {
    const asignaciones = await db.obtenerAsignacionesSensoresPorNodo(req.params.nodoId);
    res.json(asignaciones);
  } catch (error) {
    console.error('Error obteniendo asignaciones del nodo:', error);
    res.status(500).json({ error: 'Error obteniendo asignaciones del nodo' });
  }
});

// POST /api/sensor-asignaciones - Crear nueva asignación
router.post('/', async (req, res) => {
  try {
    const id = await db.insertarAsignacionSensor(req.body);
    const asignaciones = await db.obtenerAsignacionesSensoresPorNodo(req.body.nodoId || req.body.nodo_id);
    const asignacion = asignaciones.find(a => a.id === id);
    res.status(201).json(asignacion);
  } catch (error) {
    console.error('Error creando asignación de sensor:', error);
    res.status(500).json({ error: 'Error creando asignación de sensor' });
  }
});

// PUT /api/sensor-asignaciones/:id - Actualizar asignación
router.put('/:id', async (req, res) => {
  try {
    await db.actualizarAsignacionSensor(req.params.id, req.body);
    // Obtener la asignación actualizada
    const todas = await db.obtenerTodasLasAsignacionesSensores();
    const asignacion = todas.find(a => a.id === parseInt(req.params.id));
    res.json(asignacion);
  } catch (error) {
    console.error('Error actualizando asignación de sensor:', error);
    res.status(500).json({ error: 'Error actualizando asignación de sensor' });
  }
});

// DELETE /api/sensor-asignaciones/:id - Eliminar asignación
router.delete('/:id', async (req, res) => {
  try {
    await db.eliminarAsignacionSensor(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando asignación de sensor:', error);
    res.status(500).json({ error: 'Error eliminando asignación de sensor' });
  }
});

module.exports = router;
