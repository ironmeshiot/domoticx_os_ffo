// API para gestión de asignaciones de actuadores (instancias físicas)
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/manager');

const db = getDatabase();

// GET /api/actuador-asignaciones - Obtener todas las asignaciones
router.get('/', async (req, res) => {
  try {
    const asignaciones = await db.obtenerTodasLasAsignacionesActuadores();
    res.json(asignaciones);
  } catch (error) {
    console.error('Error obteniendo asignaciones de actuadores:', error);
    res.status(500).json({ error: 'Error obteniendo asignaciones de actuadores' });
  }
});

// GET /api/actuador-asignaciones/nodo/:nodoId - Obtener asignaciones de un nodo
router.get('/nodo/:nodoId', async (req, res) => {
  try {
    const asignaciones = await db.obtenerAsignacionesActuadoresPorNodo(req.params.nodoId);
    res.json(asignaciones);
  } catch (error) {
    console.error('Error obteniendo asignaciones del nodo:', error);
    res.status(500).json({ error: 'Error obteniendo asignaciones del nodo' });
  }
});

// POST /api/actuador-asignaciones - Crear nueva asignación
router.post('/', async (req, res) => {
  try {
    const id = await db.insertarAsignacionActuador(req.body);
    const asignaciones = await db.obtenerAsignacionesActuadoresPorNodo(req.body.nodoId || req.body.nodo_id);
    const asignacion = asignaciones.find(a => a.id === id);
    res.status(201).json(asignacion);
  } catch (error) {
    console.error('Error creando asignación de actuador:', error);
    res.status(500).json({ error: 'Error creando asignación de actuador' });
  }
});

// PUT /api/actuador-asignaciones/:id - Actualizar asignación
router.put('/:id', async (req, res) => {
  try {
    await db.actualizarAsignacionActuador(req.params.id, req.body);
    const todas = await db.obtenerTodasLasAsignacionesActuadores();
    const asignacion = todas.find(a => a.id === parseInt(req.params.id));
    res.json(asignacion);
  } catch (error) {
    console.error('Error actualizando asignación de actuador:', error);
    res.status(500).json({ error: 'Error actualizando asignación de actuador' });
  }
});

// DELETE /api/actuador-asignaciones/:id - Eliminar asignación
router.delete('/:id', async (req, res) => {
  try {
    await db.eliminarAsignacionActuador(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando asignación de actuador:', error);
    res.status(500).json({ error: 'Error eliminando asignación de actuador' });
  }
});

module.exports = router;
