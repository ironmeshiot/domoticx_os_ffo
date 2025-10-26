-- Esquema de base de datos para DomoticX OS FFO optimizado para Raspberry Pi
-- SQLite es ideal para sistemas embebidos como Raspberry Pi

-- Tabla de nodos (dispositivos ESP32/ESP8266)
CREATE TABLE IF NOT EXISTS nodos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- ESP32, ESP8266, etc
    mac_address VARCHAR(17) UNIQUE,
    ip_address VARCHAR(15),
    ubicacion VARCHAR(100),
    firmware_version VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'offline', -- online, offline, error
    ultimo_ping DATETIME,
    configuracion JSON,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sensores
CREATE TABLE IF NOT EXISTS sensores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nodo_id INTEGER,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- temperatura, humedad, luz, movimiento, etc
    pin INTEGER,
    unidad VARCHAR(10), -- °C, %, lux, etc
    min_valor REAL,
    max_valor REAL,
    calibracion JSON,
    configuracion JSON,
    activo BOOLEAN DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nodo_id) REFERENCES nodos(id) ON DELETE CASCADE
);

-- Tabla de actuadores
CREATE TABLE IF NOT EXISTS actuadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nodo_id INTEGER,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- relay, dimmer, servo, motor, etc
    pin INTEGER,
    estado_actual JSON, -- valor actual del actuador
    configuracion JSON,
    activo BOOLEAN DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nodo_id) REFERENCES nodos(id) ON DELETE CASCADE
);

-- Tabla de lecturas de sensores (optimizada para Raspberry Pi)
CREATE TABLE IF NOT EXISTS lecturas_sensores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id INTEGER,
    valor REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensores(id) ON DELETE CASCADE
);

-- Índice para optimizar consultas de lecturas por fecha
CREATE INDEX IF NOT EXISTS idx_lecturas_timestamp ON lecturas_sensores(timestamp);
CREATE INDEX IF NOT EXISTS idx_lecturas_sensor_timestamp ON lecturas_sensores(sensor_id, timestamp);

-- Tabla de comandos a actuadores
CREATE TABLE IF NOT EXISTS comandos_actuadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actuador_id INTEGER,
    comando JSON NOT NULL,
    ejecutado BOOLEAN DEFAULT 0,
    resultado JSON,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actuador_id) REFERENCES actuadores(id) ON DELETE CASCADE
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'usuario', -- admin, usuario, invitado
    activo BOOLEAN DEFAULT 1,
    ultimo_login DATETIME,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    token VARCHAR(255) UNIQUE NOT NULL,
    expira_en DATETIME NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT,
    descripcion TEXT,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de logs del sistema (optimizada para evitar crecimiento excesivo)
CREATE TABLE IF NOT EXISTS logs_sistema (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nivel VARCHAR(10) NOT NULL, -- debug, info, warning, error, critical
    modulo VARCHAR(50),
    mensaje TEXT NOT NULL,
    detalles JSON,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índice para logs por nivel y fecha
CREATE INDEX IF NOT EXISTS idx_logs_nivel_timestamp ON logs_sistema(nivel, timestamp);

-- Tabla de automatizaciones/reglas
CREATE TABLE IF NOT EXISTS automatizaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    condiciones JSON NOT NULL, -- condiciones para activar
    acciones JSON NOT NULL, -- acciones a ejecutar
    activa BOOLEAN DEFAULT 1,
    usuario_id INTEGER,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de ejecuciones de automatizaciones
CREATE TABLE IF NOT EXISTS ejecuciones_automatizaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automatizacion_id INTEGER,
    resultado VARCHAR(20), -- exitoso, error, parcial
    detalles JSON,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (automatizacion_id) REFERENCES automatizaciones(id) ON DELETE CASCADE
);

-- Tabla de configuración WiFi para nodos
CREATE TABLE IF NOT EXISTS configuracion_wifi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nodo_id INTEGER UNIQUE,
    ssid VARCHAR(32),
    password VARCHAR(64),
    canal INTEGER DEFAULT 1,
    modo_red VARCHAR(20) DEFAULT 'wifi', -- wifi, espnow, lora
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nodo_id) REFERENCES nodos(id) ON DELETE CASCADE
);

-- Insertar configuración inicial
INSERT OR IGNORE INTO configuracion_sistema (clave, valor, descripcion) VALUES
('sistema_nombre', 'DomoticX OS FFO', 'Nombre del sistema'),
('version', '1.0.0', 'Versión actual del sistema'),
('backup_automatico', 'true', 'Habilitar backups automáticos'),
('retention_lecturas_dias', '30', 'Días de retención de lecturas de sensores'),
('retention_logs_dias', '7', 'Días de retención de logs'),
('websocket_puerto', '4001', 'Puerto para WebSocket'),
('mqtt_habilitado', 'false', 'Habilitar cliente MQTT'),
('notificaciones_email', 'false', 'Habilitar notificaciones por email');

-- Crear usuario admin por defecto
INSERT OR IGNORE INTO usuarios (username, email, password_hash, rol) VALUES 
('admin', 'admin@domoticx.local', '$2b$10$placeholder_hash', 'admin');