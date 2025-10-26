// API para gestión de actuadores
const express = require('express');
const { getDatabase } = require('../database/manager');
const router = express.Router();

// Obtener TODOS los actuadores del sistema
router.get('/actuadores', async (req, res) => {
  try {
    const db = getDatabase();
    const actuadores = await db.obtenerTodosLosActuadores();
    res.json(actuadores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los actuadores de un nodo
router.get('/nodos/:nodoId/actuadores', async (req, res) => {
  try {
    const db = getDatabase();
    const actuadores = await db.obtenerActuadoresPorNodo(req.params.nodoId);
    res.json(actuadores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo actuador
router.post('/actuadores', async (req, res) => {
  try {
    const db = getDatabase();
    const id = await db.insertarActuador(req.body);
    res.json({ id, mensaje: 'Actuador creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar actuador
router.put('/actuadores/:id', async (req, res) => {
  try {
    const db = getDatabase();
    await db.actualizarActuador(req.params.id, req.body);
    res.json({ mensaje: 'Actuador actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar actuador
router.delete('/actuadores/:id', async (req, res) => {
  try {
    const db = getDatabase();
    await db.eliminarActuador(req.params.id);
    res.json({ mensaje: 'Actuador eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar comando a actuador
router.post('/actuadores/:id/comando', async (req, res) => {
  try {
    const db = getDatabase();
    const id = await db.enviarComandoActuador(req.params.id, req.body.comando);
    res.json({ id, mensaje: 'Comando enviado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;