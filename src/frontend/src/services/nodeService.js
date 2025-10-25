const API_BASE = process.env.REACT_APP_API_BASE || '/api';

async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  };

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  const respuesta = await fetch(`${API_BASE}${endpoint}`, config);
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ error: respuesta.statusText }));
    throw new Error(error.error || 'Error al comunicarse con el servidor');
  }

  if (respuesta.status === 204) return null;
  return respuesta.json();
}

// ------------------------ Nodos ------------------------
export async function getNodes() {
  const data = await request('/nodos');
  return data.map(normalizarNodo);
}

export async function getNodeById(id) {
  const data = await request(`/nodos/${id}`);
  return normalizarNodo(data);
}

export async function createNode(payload) {
  const body = prepararNodoPayload(payload);
  const respuesta = await request('/nodos', { method: 'POST', body });
  return normalizarNodo(respuesta.nodo);
}

export async function updateNode(id, payload) {
  const body = prepararNodoPayload(payload);
  const respuesta = await request(`/nodos/${id}`, { method: 'PUT', body });
  return normalizarNodo(respuesta.nodo);
}

export async function deleteNode(id) {
  await request(`/nodos/${id}`, { method: 'DELETE' });
}

function prepararNodoPayload(nodo = {}) {
  return {
    nombre: nodo.nombre,
    tipo: nodo.tipo,
    ubicacion: nodo.ubicacion || null,
    mac_address: nodo.macAddress || nodo.mac_address || null,
    ip_address: nodo.ipAddress || nodo.ip_address || null,
    firmware_version: nodo.firmwareVersion || nodo.firmware_version || null,
    estado: nodo.estado || null,
    descripcion: nodo.descripcion || '',
    tags: Array.isArray(nodo.tags)
      ? nodo.tags
      : typeof nodo.tags === 'string'
        ? nodo.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    // Configuración WiFi/Red
    ssid: nodo.ssid || null,
    wifiPass: nodo.wifiPass || null,
    canal: nodo.canal || null,
    failover: nodo.failover || null,
    gpioSensores: nodo.gpioSensores || null,
    gpioActuadores: nodo.gpioActuadores || null,
    gpioLibres: nodo.gpioLibres || null
  };
}

function normalizarNodo(nodo) {
  if (!nodo) return null;
  return {
    id: nodo.id,
    nombre: nodo.nombre,
    tipo: nodo.tipo,
    ubicacion: nodo.ubicacion,
    macAddress: nodo.macAddress || nodo.mac_address || null,
    ipAddress: nodo.ipAddress || nodo.ip_address || null,
    firmwareVersion: nodo.firmwareVersion || nodo.firmware_version || null,
    estado: nodo.estado,
    ultimoPing: nodo.ultimoPing || nodo.ultimo_ping || null,
    descripcion: nodo.descripcion || '',
    tags: Array.isArray(nodo.tags) ? nodo.tags : [],
    // Configuración WiFi/Red
    ssid: nodo.ssid || null,
    wifiPass: nodo.wifiPass || null,
    canal: nodo.canal || null,
    failover: nodo.failover || null,
    gpioSensores: nodo.gpioSensores || null,
    gpioActuadores: nodo.gpioActuadores || null,
    gpioLibres: nodo.gpioLibres || null
  };
}

// ------------------------ Sensores ------------------------
export async function getAllSensors() {
  const data = await request('/sensores');
  return data.map(normalizarSensor);
}

export async function getSensorsByNode(nodoId) {
  if (!nodoId) return getAllSensors();
  const data = await request(`/nodos/${nodoId}/sensores`);
  return data.map(normalizarSensor);
}

export async function createSensor(nodoId, payload) {
  const body = prepararSensorPayload(nodoId, payload);
  const respuesta = await request('/sensores', { method: 'POST', body });
  return normalizarSensor(respuesta.sensor || { ...payload, id: respuesta.id });
}

export async function updateSensor(id, payload) {
  const body = prepararSensorPayload(null, payload);
  await request(`/sensores/${id}`, { method: 'PUT', body });
}

export async function deleteSensor(id) {
  await request(`/sensores/${id}`, { method: 'DELETE' });
}

function prepararSensorPayload(nodoId, sensor = {}) {
  return {
    nodo_id: nodoId || sensor.nodoId,
    nombre: sensor.nombre,
    tipo: sensor.tipo,
    pin: sensor.pin,
    unidad: sensor.unidad,
    min_valor: sensor.minValor ?? sensor.min_valor ?? 0,
    max_valor: sensor.maxValor ?? sensor.max_valor ?? 0,
    calibracion: sensor.calibracion || {},
    configuracion: sensor.configuracion || {},
    activo: sensor.activo !== false
  };
}

function normalizarSensor(sensor) {
  return {
    id: sensor.id,
    nodoId: sensor.nodoId || sensor.nodo_id,
    nodoNombre: sensor.nodoNombre || sensor.nodo_nombre,
    nombre: sensor.nombre,
    tipo: sensor.tipo,
    pin: sensor.pin,
    unidad: sensor.unidad,
    minValor: sensor.minValor ?? sensor.min_valor,
    maxValor: sensor.maxValor ?? sensor.max_valor,
    calibracion: sensor.calibracion || {},
    configuracion: sensor.configuracion || {},
    activo: sensor.activo !== false
  };
}

// ------------------------ Actuadores ------------------------
export async function getAllActuators() {
  const data = await request('/actuadores');
  return data.map(normalizarActuador);
}

export async function getActuatorsByNode(nodoId) {
  if (!nodoId) return getAllActuators();
  const data = await request(`/nodos/${nodoId}/actuadores`);
  return data.map(normalizarActuador);
}

export async function createActuator(nodoId, payload) {
  const body = prepararActuadorPayload(nodoId, payload);
  const respuesta = await request('/actuadores', { method: 'POST', body });
  return normalizarActuador(respuesta.actuador || { ...payload, id: respuesta.id });
}

export async function updateActuator(id, payload) {
  const body = prepararActuadorPayload(null, payload);
  await request(`/actuadores/${id}`, { method: 'PUT', body });
}

export async function deleteActuator(id) {
  await request(`/actuadores/${id}`, { method: 'DELETE' });
}

function prepararActuadorPayload(nodoId, actuador = {}) {
  return {
    nodo_id: nodoId || actuador.nodoId,
    nombre: actuador.nombre,
    tipo: actuador.tipo,
    pin: actuador.pin,
    configuracion: actuador.configuracion || {},
    estado: actuador.estado || actuador.estado_actual || null,
    estado_actual: actuador.estado_actual || actuador.estado || null,
    activo: actuador.activo !== false
  };
}

function normalizarActuador(actuador) {
  return {
    id: actuador.id,
    nodoId: actuador.nodoId || actuador.nodo_id,
    nodoNombre: actuador.nodoNombre || actuador.nodo_nombre,
    nombre: actuador.nombre,
    tipo: actuador.tipo,
    pin: actuador.pin,
    configuracion: actuador.configuracion || {},
    estado: actuador.estado || null,
    activo: actuador.activo !== false
  };
}


export function resetData() {
  console.warn('resetData ya no está disponible en modo API');
  return Promise.resolve();
}

// ======================== DEFINICIONES DE SENSORES ========================
export async function getSensorDefinitions() {
  const data = await request('/sensores-definiciones');
  return data.map(normalizarDefinicionSensor);
}

export async function getSensorDefinitionById(id) {
  const data = await request(`/sensores-definiciones/${id}`);
  return normalizarDefinicionSensor(data);
}

export async function createSensorDefinition(payload) {
  const body = prepararDefinicionSensorPayload(payload);
  const respuesta = await request('/sensores-definiciones', { method: 'POST', body });
  return normalizarDefinicionSensor(respuesta);
}

export async function updateSensorDefinition(id, payload) {
  const body = prepararDefinicionSensorPayload(payload);
  const respuesta = await request(`/sensores-definiciones/${id}`, { method: 'PUT', body });
  return normalizarDefinicionSensor(respuesta);
}

export async function deleteSensorDefinition(id) {
  await request(`/sensores-definiciones/${id}`, { method: 'DELETE' });
}

function prepararDefinicionSensorPayload(def = {}) {
  return {
    nombre: def.nombre,
    tipo: def.tipo,
    modelo: def.modelo || null,
    fabricante: def.fabricante || null,
    protocolo: def.protocolo || null,
    voltajeMin: def.voltajeMin ?? def.voltaje_min ?? null,
    voltajeMax: def.voltajeMax ?? def.voltaje_max ?? null,
    pinesRequeridos: def.pinesRequeridos ?? def.pines_requeridos ?? 1,
    tipoPin: def.tipoPin ?? def.tipo_pin ?? 'digital',
    unidad: def.unidad || null,
    minValor: def.minValor ?? def.min_valor ?? null,
    maxValor: def.maxValor ?? def.max_valor ?? null,
    precisionValor: def.precisionValor ?? def.precision_valor ?? null,
    tiempoLecturaMs: def.tiempoLecturaMs ?? def.tiempo_lectura_ms ?? null,
    calibracionDefault: def.calibracionDefault || def.calibracion_default || {},
    configuracionDefault: def.configuracionDefault || def.configuracion_default || {},
    especificaciones: def.especificaciones || {},
    notas: def.notas || null,
    datasheetUrl: def.datasheetUrl || def.datasheet_url || null,
    activo: def.activo !== false
  };
}

function normalizarDefinicionSensor(def) {
  return {
    id: def.id,
    nombre: def.nombre,
    tipo: def.tipo,
    modelo: def.modelo,
    fabricante: def.fabricante,
    protocolo: def.protocolo,
    voltajeMin: def.voltajeMin ?? def.voltaje_min,
    voltajeMax: def.voltajeMax ?? def.voltaje_max,
    pinesRequeridos: def.pinesRequeridos ?? def.pines_requeridos,
    tipoPin: def.tipoPin ?? def.tipo_pin,
    unidad: def.unidad,
    minValor: def.minValor ?? def.min_valor,
    maxValor: def.maxValor ?? def.max_valor,
    precisionValor: def.precisionValor ?? def.precision_valor,
    tiempoLecturaMs: def.tiempoLecturaMs ?? def.tiempo_lectura_ms,
    calibracionDefault: def.calibracionDefault || def.calibracion_default || {},
    configuracionDefault: def.configuracionDefault || def.configuracion_default || {},
    especificaciones: def.especificaciones || {},
    notas: def.notas,
    datasheetUrl: def.datasheetUrl || def.datasheet_url,
    activo: def.activo !== false,
    creadoEn: def.creadoEn || def.creado_en,
    actualizadoEn: def.actualizadoEn || def.actualizado_en
  };
}

// ======================== ASIGNACIONES DE SENSORES ========================
export async function getSensorAssignments() {
  const data = await request('/sensor-asignaciones');
  return data.map(normalizarAsignacionSensor);
}

export async function getSensorAssignmentsByNode(nodoId) {
  const data = await request(`/sensor-asignaciones/nodo/${nodoId}`);
  return data.map(normalizarAsignacionSensor);
}

export async function createSensorAssignment(payload) {
  const body = prepararAsignacionSensorPayload(payload);
  const respuesta = await request('/sensor-asignaciones', { method: 'POST', body });
  return normalizarAsignacionSensor(respuesta);
}

export async function updateSensorAssignment(id, payload) {
  const body = prepararAsignacionSensorPayload(payload);
  const respuesta = await request(`/sensor-asignaciones/${id}`, { method: 'PUT', body });
  return normalizarAsignacionSensor(respuesta);
}

export async function deleteSensorAssignment(id) {
  await request(`/sensor-asignaciones/${id}`, { method: 'DELETE' });
}

function prepararAsignacionSensorPayload(asig = {}) {
  return {
    definicionId: asig.definicionId || asig.definicion_id,
    nodoId: asig.nodoId || asig.nodo_id,
    pin: asig.pin,
    alias: asig.alias,
    ubicacionEspecifica: asig.ubicacionEspecifica || asig.ubicacion_especifica || null,
    calibracion: asig.calibracion || {},
    configuracion: asig.configuracion || {},
    fechaInstalacion: asig.fechaInstalacion || asig.fecha_instalacion || null,
    activo: asig.activo !== false,
    notas: asig.notas || null
  };
}

function normalizarAsignacionSensor(asig) {
  return {
    id: asig.id,
    definicionId: asig.definicionId || asig.definicion_id,
    nodoId: asig.nodoId || asig.nodo_id,
    pin: asig.pin,
    alias: asig.alias,
    ubicacionEspecifica: asig.ubicacionEspecifica || asig.ubicacion_especifica,
    calibracion: asig.calibracion || {},
    configuracion: asig.configuracion || {},
    fechaInstalacion: asig.fechaInstalacion || asig.fecha_instalacion,
    activo: asig.activo !== false,
    ultimaLectura: asig.ultimaLectura || asig.ultima_lectura,
    notas: asig.notas,
    definicionNombre: asig.definicionNombre || asig.definicion_nombre,
    nodoNombre: asig.nodoNombre || asig.nodo_nombre,
    creadoEn: asig.creadoEn || asig.creado_en,
    actualizadoEn: asig.actualizadoEn || asig.actualizado_en
  };
}

// ======================== DEFINICIONES DE ACTUADORES ========================
export async function getActuatorDefinitions() {
  const data = await request('/actuadores-definiciones');
  return data.map(normalizarDefinicionActuador);
}

export async function getActuatorDefinitionById(id) {
  const data = await request(`/actuadores-definiciones/${id}`);
  return normalizarDefinicionActuador(data);
}

export async function createActuatorDefinition(payload) {
  const body = prepararDefinicionActuadorPayload(payload);
  const respuesta = await request('/actuadores-definiciones', { method: 'POST', body });
  return normalizarDefinicionActuador(respuesta);
}

export async function updateActuatorDefinition(id, payload) {
  const body = prepararDefinicionActuadorPayload(payload);
  const respuesta = await request(`/actuadores-definiciones/${id}`, { method: 'PUT', body });
  return normalizarDefinicionActuador(respuesta);
}

export async function deleteActuatorDefinition(id) {
  await request(`/actuadores-definiciones/${id}`, { method: 'DELETE' });
}

function prepararDefinicionActuadorPayload(def = {}) {
  return {
    nombre: def.nombre,
    tipo: def.tipo,
    modelo: def.modelo || null,
    fabricante: def.fabricante || null,
    protocolo: def.protocolo || null,
    voltajeMin: def.voltajeMin ?? def.voltaje_min ?? null,
    voltajeMax: def.voltajeMax ?? def.voltaje_max ?? null,
    corrienteMax: def.corrienteMax ?? def.corriente_max ?? null,
    potenciaMax: def.potenciaMax ?? def.potencia_max ?? null,
    pinesRequeridos: def.pinesRequeridos ?? def.pines_requeridos ?? 1,
    tipoPin: def.tipoPin ?? def.tipo_pin ?? 'digital',
    rangoControlMin: def.rangoControlMin ?? def.rango_control_min ?? null,
    rangoControlMax: def.rangoControlMax ?? def.rango_control_max ?? null,
    tiempoRespuestaMs: def.tiempoRespuestaMs ?? def.tiempo_respuesta_ms ?? null,
    configuracionDefault: def.configuracionDefault || def.configuracion_default || {},
    especificaciones: def.especificaciones || {},
    notas: def.notas || null,
    datasheetUrl: def.datasheetUrl || def.datasheet_url || null,
    activo: def.activo !== false
  };
}

function normalizarDefinicionActuador(def) {
  return {
    id: def.id,
    nombre: def.nombre,
    tipo: def.tipo,
    modelo: def.modelo,
    fabricante: def.fabricante,
    protocolo: def.protocolo,
    voltajeMin: def.voltajeMin ?? def.voltaje_min,
    voltajeMax: def.voltajeMax ?? def.voltaje_max,
    corrienteMax: def.corrienteMax ?? def.corriente_max,
    potenciaMax: def.potenciaMax ?? def.potencia_max,
    pinesRequeridos: def.pinesRequeridos ?? def.pines_requeridos,
    tipoPin: def.tipoPin ?? def.tipo_pin,
    rangoControlMin: def.rangoControlMin ?? def.rango_control_min,
    rangoControlMax: def.rangoControlMax ?? def.rango_control_max,
    tiempoRespuestaMs: def.tiempoRespuestaMs ?? def.tiempo_respuesta_ms,
    configuracionDefault: def.configuracionDefault || def.configuracion_default || {},
    especificaciones: def.especificaciones || {},
    notas: def.notas,
    datasheetUrl: def.datasheetUrl || def.datasheet_url,
    activo: def.activo !== false,
    creadoEn: def.creadoEn || def.creado_en,
    actualizadoEn: def.actualizadoEn || def.actualizado_en
  };
}

// ======================== ASIGNACIONES DE ACTUADORES ========================
export async function getActuatorAssignments() {
  const data = await request('/actuador-asignaciones');
  return data.map(normalizarAsignacionActuador);
}

export async function getActuatorAssignmentsByNode(nodoId) {
  const data = await request(`/actuador-asignaciones/nodo/${nodoId}`);
  return data.map(normalizarAsignacionActuador);
}

export async function createActuatorAssignment(payload) {
  const body = prepararAsignacionActuadorPayload(payload);
  const respuesta = await request('/actuador-asignaciones', { method: 'POST', body });
  return normalizarAsignacionActuador(respuesta);
}

export async function updateActuatorAssignment(id, payload) {
  const body = prepararAsignacionActuadorPayload(payload);
  const respuesta = await request(`/actuador-asignaciones/${id}`, { method: 'PUT', body });
  return normalizarAsignacionActuador(respuesta);
}

export async function deleteActuatorAssignment(id) {
  await request(`/actuador-asignaciones/${id}`, { method: 'DELETE' });
}

function prepararAsignacionActuadorPayload(asig = {}) {
  return {
    definicionId: asig.definicionId || asig.definicion_id,
    nodoId: asig.nodoId || asig.nodo_id,
    pin: asig.pin,
    alias: asig.alias,
    ubicacionEspecifica: asig.ubicacionEspecifica || asig.ubicacion_especifica || null,
    configuracion: asig.configuracion || {},
    estadoActual: asig.estadoActual || asig.estado_actual || null,
    fechaInstalacion: asig.fechaInstalacion || asig.fecha_instalacion || null,
    activo: asig.activo !== false,
    notas: asig.notas || null
  };
}

function normalizarAsignacionActuador(asig) {
  return {
    id: asig.id,
    definicionId: asig.definicionId || asig.definicion_id,
    nodoId: asig.nodoId || asig.nodo_id,
    pin: asig.pin,
    alias: asig.alias,
    ubicacionEspecifica: asig.ubicacionEspecifica || asig.ubicacion_especifica,
    configuracion: asig.configuracion || {},
    estadoActual: asig.estadoActual || asig.estado_actual,
    fechaInstalacion: asig.fechaInstalacion || asig.fecha_instalacion,
    activo: asig.activo !== false,
    ultimaActivacion: asig.ultimaActivacion || asig.ultima_activacion,
    notas: asig.notas,
    definicionNombre: asig.definicionNombre || asig.definicion_nombre,
    nodoNombre: asig.nodoNombre || asig.nodo_nombre,
    creadoEn: asig.creadoEn || asig.creado_en,
    actualizadoEn: asig.actualizadoEn || asig.actualizado_en
  };
}
