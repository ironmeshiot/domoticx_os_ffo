-- Migración: Separación de definiciones y asignaciones
-- Convierte sensores/actuadores en modelo de biblioteca + instancias

-- ============================================================================
-- PASO 1: Crear nuevas tablas de definiciones
-- ============================================================================

-- Tabla de definiciones de sensores (biblioteca técnica)
CREATE TABLE IF NOT EXISTS sensores_definiciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE, -- ej: "DHT22", "BME280", "HC-SR04"
    tipo VARCHAR(50) NOT NULL, -- temperatura, humedad, distancia, luz, etc
    modelo VARCHAR(100), -- modelo comercial específico
    fabricante VARCHAR(100),
    protocolo VARCHAR(50), -- OneWire, I2C, SPI, Analog, Digital
    voltaje_min REAL, -- voltaje mínimo requerido (ej: 3.3)
    voltaje_max REAL, -- voltaje máximo permitido (ej: 5.0)
    pines_requeridos INTEGER DEFAULT 1, -- cantidad de pines GPIO necesarios
    tipo_pin VARCHAR(50), -- digital, analog, pwm, i2c, spi
    unidad VARCHAR(10), -- °C, %, lux, cm, etc
    min_valor REAL, -- rango mínimo de lectura
    max_valor REAL, -- rango máximo de lectura
    precision_valor REAL, -- precisión del sensor (ej: 0.5 para ±0.5°C)
    tiempo_lectura_ms INTEGER, -- tiempo típico de lectura en ms
    calibracion_default JSON, -- parámetros de calibración por defecto
    configuracion_default JSON, -- configuración inicial recomendada
    especificaciones JSON, -- specs técnicas adicionales
    notas TEXT, -- notas de instalación, compatibilidad, etc
    datasheet_url TEXT, -- enlace al datasheet
    activo BOOLEAN DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de asignaciones de sensores (instancias físicas)
CREATE TABLE IF NOT EXISTS sensor_asignaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    definicion_id INTEGER NOT NULL, -- referencia a sensores_definiciones
    nodo_id INTEGER NOT NULL, -- nodo donde está instalado
    pin INTEGER, -- GPIO del nodo
    alias VARCHAR(100), -- nombre personalizado (ej: "Sensor Cocina Principal")
    ubicacion_especifica VARCHAR(200), -- ubicación detallada
    calibracion JSON, -- calibración específica de esta instancia
    configuracion JSON, -- configuración específica de esta instancia
    fecha_instalacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT 1,
    ultima_lectura DATETIME,
    notas TEXT, -- notas específicas de esta instalación
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (definicion_id) REFERENCES sensores_definiciones(id) ON DELETE RESTRICT,
    FOREIGN KEY (nodo_id) REFERENCES nodos(id) ON DELETE CASCADE,
    UNIQUE(nodo_id, pin) -- un pin solo puede tener una asignación activa
);

-- Tabla de definiciones de actuadores (biblioteca técnica)
CREATE TABLE IF NOT EXISTS actuadores_definiciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE, -- ej: "Relay 5V", "Servo SG90", "LED PWM"
    tipo VARCHAR(50) NOT NULL, -- relay, dimmer, servo, motor, led, etc
    modelo VARCHAR(100),
    fabricante VARCHAR(100),
    protocolo VARCHAR(50), -- Digital, PWM, I2C, SPI
    voltaje_min REAL,
    voltaje_max REAL,
    corriente_max REAL, -- corriente máxima en Amperes
    potencia_max REAL, -- potencia máxima en Watts
    pines_requeridos INTEGER DEFAULT 1,
    tipo_pin VARCHAR(50), -- digital, pwm, i2c, spi
    rango_control_min REAL, -- valor mínimo de control (ej: 0)
    rango_control_max REAL, -- valor máximo de control (ej: 255 para PWM)
    tiempo_respuesta_ms INTEGER, -- tiempo típico de respuesta
    configuracion_default JSON, -- configuración inicial recomendada
    especificaciones JSON, -- specs técnicas adicionales
    notas TEXT,
    datasheet_url TEXT,
    activo BOOLEAN DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de asignaciones de actuadores (instancias físicas)
CREATE TABLE IF NOT EXISTS actuador_asignaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    definicion_id INTEGER NOT NULL,
    nodo_id INTEGER NOT NULL,
    pin INTEGER,
    alias VARCHAR(100),
    ubicacion_especifica VARCHAR(200),
    configuracion JSON,
    estado_actual JSON, -- estado actual del actuador
    fecha_instalacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT 1,
    ultima_activacion DATETIME,
    notas TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (definicion_id) REFERENCES actuadores_definiciones(id) ON DELETE RESTRICT,
    FOREIGN KEY (nodo_id) REFERENCES nodos(id) ON DELETE CASCADE,
    UNIQUE(nodo_id, pin)
);

-- ============================================================================
-- PASO 2: Índices para optimizar consultas
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sensor_asignaciones_nodo ON sensor_asignaciones(nodo_id);
CREATE INDEX IF NOT EXISTS idx_sensor_asignaciones_def ON sensor_asignaciones(definicion_id);
CREATE INDEX IF NOT EXISTS idx_sensor_asignaciones_activo ON sensor_asignaciones(activo);

CREATE INDEX IF NOT EXISTS idx_actuador_asignaciones_nodo ON actuador_asignaciones(nodo_id);
CREATE INDEX IF NOT EXISTS idx_actuador_asignaciones_def ON actuador_asignaciones(definicion_id);
CREATE INDEX IF NOT EXISTS idx_actuador_asignaciones_activo ON actuador_asignaciones(activo);

-- ============================================================================
-- PASO 3: Migrar datos existentes
-- ============================================================================

-- Migrar sensores existentes
-- Primero creamos definiciones únicas por tipo
INSERT INTO sensores_definiciones (nombre, tipo, unidad, min_valor, max_valor, protocolo, pines_requeridos, tipo_pin)
SELECT DISTINCT 
    tipo || ' (migrado)', -- nombre basado en tipo
    tipo,
    unidad,
    min_valor,
    max_valor,
    'Digital', -- asumimos digital por defecto
    1,
    'digital'
FROM sensores
WHERE tipo NOT IN (SELECT nombre FROM sensores_definiciones);

-- Luego creamos asignaciones basadas en los sensores existentes
INSERT INTO sensor_asignaciones (definicion_id, nodo_id, pin, alias, calibracion, configuracion, activo, fecha_instalacion)
SELECT 
    (SELECT id FROM sensores_definiciones WHERE nombre = s.tipo || ' (migrado)' LIMIT 1),
    s.nodo_id,
    s.pin,
    s.nombre,
    s.calibracion,
    s.configuracion,
    s.activo,
    s.creado_en
FROM sensores s;

-- Migrar actuadores existentes
INSERT INTO actuadores_definiciones (nombre, tipo, protocolo, pines_requeridos, tipo_pin)
SELECT DISTINCT 
    tipo || ' (migrado)',
    tipo,
    'Digital',
    1,
    'digital'
FROM actuadores
WHERE tipo NOT IN (SELECT nombre FROM actuadores_definiciones);

INSERT INTO actuador_asignaciones (definicion_id, nodo_id, pin, alias, configuracion, estado_actual, activo, fecha_instalacion)
SELECT 
    (SELECT id FROM actuadores_definiciones WHERE nombre = a.tipo || ' (migrado)' LIMIT 1),
    a.nodo_id,
    a.pin,
    a.nombre,
    a.configuracion,
    a.estado_actual,
    a.activo,
    a.creado_en
FROM actuadores a;

-- ============================================================================
-- PASO 4: Actualizar referencias en lecturas_sensores
-- ============================================================================

-- Agregar columna para referenciar asignaciones en lugar de sensores viejos
ALTER TABLE lecturas_sensores ADD COLUMN asignacion_id INTEGER;

-- Migrar referencias (mapear sensor_id antiguo a nueva asignacion_id)
UPDATE lecturas_sensores
SET asignacion_id = (
    SELECT sa.id 
    FROM sensor_asignaciones sa
    JOIN sensores s ON s.nodo_id = sa.nodo_id AND s.pin = sa.pin AND s.nombre = sa.alias
    WHERE s.id = lecturas_sensores.sensor_id
    LIMIT 1
);

-- ============================================================================
-- PASO 5: Actualizar referencias en comandos_actuadores
-- ============================================================================

ALTER TABLE comandos_actuadores ADD COLUMN asignacion_id INTEGER;

UPDATE comandos_actuadores
SET asignacion_id = (
    SELECT aa.id 
    FROM actuador_asignaciones aa
    JOIN actuadores a ON a.nodo_id = aa.nodo_id AND a.pin = aa.pin AND a.nombre = aa.alias
    WHERE a.id = comandos_actuadores.actuador_id
    LIMIT 1
);

-- ============================================================================
-- PASO 6: Renombrar tablas antiguas (backup)
-- ============================================================================

-- Renombramos en lugar de eliminar para mantener backup
ALTER TABLE sensores RENAME TO sensores_legacy;
ALTER TABLE actuadores RENAME TO actuadores_legacy;

-- ============================================================================
-- NOTAS FINALES
-- ============================================================================

-- Las tablas legacy se mantienen como backup
-- Se pueden eliminar después de verificar que todo funciona:
-- DROP TABLE IF EXISTS sensores_legacy;
-- DROP TABLE IF EXISTS actuadores_legacy;

-- Las referencias en lecturas_sensores y comandos_actuadores ahora usan asignacion_id
-- Eventualmente se pueden crear foreign keys:
-- ALTER TABLE lecturas_sensores ADD FOREIGN KEY (asignacion_id) REFERENCES sensor_asignaciones(id);
-- ALTER TABLE comandos_actuadores ADD FOREIGN KEY (asignacion_id) REFERENCES actuador_asignaciones(id);
