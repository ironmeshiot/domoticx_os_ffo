// Generador de firmware ESP32 basado en configuración de nodo
const fs = require('fs');
const path = require('path');

class ESP32FirmwareGenerator {
  constructor(nodo, sensoresAsignados, actuadoresAsignados, definicionesSensores, definicionesActuadores) {
    this.nodo = nodo;
    this.sensoresAsignados = sensoresAsignados;
    this.actuadoresAsignados = actuadoresAsignados;
    this.definicionesSensores = definicionesSensores;
    this.definicionesActuadores = definicionesActuadores;
  }

  // Generar código Arduino/PlatformIO completo
  generarFirmware() {
    const includes = this.generarIncludes();
    const definiciones = this.generarDefiniciones();
    const variablesGlobales = this.generarVariablesGlobales();
    const setupSensores = this.generarSetupSensores();
    const setupActuadores = this.generarSetupActuadores();
    const loopLecturas = this.generarLoopLecturas();
    const funcionesAuxiliares = this.generarFuncionesAuxiliares();

    return `
/*
 * Firmware Auto-Generado para ${this.nodo.nombre}
 * Tipo: ${this.nodo.tipo}
 * Ubicación: ${this.nodo.ubicacion || 'No especificada'}
 * MAC Address: ${this.nodo.macAddress || 'Auto'}
 * 
 * Generado automáticamente por DomoticX OS FFO
 * NO EDITAR MANUALMENTE - Regenerar desde el dashboard
 */

${includes}

${definiciones}

${variablesGlobales}

void setup() {
  Serial.begin(115200);
  Serial.println("\\n=== Iniciando ${this.nodo.nombre} ===");
  
  // Configurar WiFi
  setupWiFi();
  
  // Configurar sensores
${setupSensores}
  
  // Configurar actuadores
${setupActuadores}
  
  Serial.println("=== Nodo listo ===");
}

void loop() {
  // Mantener conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado, reconectando...");
    setupWiFi();
  }
  
  // Leer sensores y enviar al servidor
${loopLecturas}
  
  // Procesar comandos del servidor
  procesarComandos();
  
  delay(${this.calcularIntervaloLectura()});
}

${funcionesAuxiliares}
`;
  }

  generarIncludes() {
    const libs = new Set(['WiFi.h', 'HTTPClient.h', 'ArduinoJson.h']);
    
    // Agregar librerías según tipos de sensores
    this.sensoresAsignados.forEach(asig => {
      const def = this.definicionesSensores.find(d => d.id === asig.definicionId);
      if (!def) return;
      
      switch (def.tipo) {
        case 'temperatura':
        case 'humedad':
          if (def.protocolo === 'OneWire') libs.add('DHT.h');
          if (def.modelo?.includes('BME')) libs.add('Adafruit_BME280.h');
          break;
        case 'distancia':
          // Ultrasonido no necesita librería especial
          break;
        case 'luz':
          // Sensor analógico simple
          break;
      }
    });
    
    return Array.from(libs).map(lib => `#include <${lib}>`).join('\n');
  }

  generarDefiniciones() {
    let codigo = '\n// Configuración del servidor\n';
    codigo += `#define SERVER_URL "http://${this.nodo.ipAddress || '192.168.1.100'}:4000"\n`;
    codigo += `#define NODO_ID ${this.nodo.id}\n`;
    codigo += `#define NODO_NOMBRE "${this.nodo.nombre}"\n\n`;
    
    codigo += '// Configuración WiFi\n';
    codigo += '#define WIFI_SSID "TU_WIFI_SSID"  // CAMBIAR\n';
    codigo += '#define WIFI_PASSWORD "TU_WIFI_PASSWORD"  // CAMBIAR\n\n';
    
    codigo += '// Pines de sensores\n';
    this.sensoresAsignados.forEach(asig => {
      const def = this.definicionesSensores.find(d => d.id === asig.definicionId);
      if (def) {
        codigo += `#define PIN_SENSOR_${this.sanitizarNombre(asig.alias || def.nombre)} ${asig.pin}\n`;
      }
    });
    
    codigo += '\n// Pines de actuadores\n';
    this.actuadoresAsignados.forEach(asig => {
      const def = this.definicionesActuadores.find(d => d.id === asig.definicionId);
      if (def) {
        codigo += `#define PIN_ACTUADOR_${this.sanitizarNombre(asig.alias || def.nombre)} ${asig.pin}\n`;
      }
    });
    
    return codigo;
  }

  generarVariablesGlobales() {
    let codigo = '\n// Variables globales\n';
    codigo += 'WiFiClient wifiClient;\n';
    codigo += 'unsigned long ultimaLectura = 0;\n\n';
    
    // Variables para cada sensor
    this.sensoresAsignados.forEach(asig => {
      const def = this.definicionesSensores.find(d => d.id === asig.definicionId);
      if (!def) return;
      
      const varName = this.sanitizarNombre(asig.alias || def.nombre);
      
      if (def.protocolo === 'OneWire' && def.modelo?.includes('DHT')) {
        codigo += `DHT dht_${varName}(PIN_SENSOR_${varName}, DHT22);\n`;
      }
    });
    
    return codigo;
  }

  generarSetupSensores() {
    let codigo = '';
    
    this.sensoresAsignados.forEach(asig => {
      const def = this.definicionesSensores.find(d => d.id === asig.definicionId);
      if (!def) return;
      
      const varName = this.sanitizarNombre(asig.alias || def.nombre);
      
      codigo += `  // Sensor: ${asig.alias || def.nombre} (${def.tipo})\n`;
      
      switch (def.tipo) {
        case 'temperatura':
        case 'humedad':
          if (def.protocolo === 'OneWire') {
            codigo += `  dht_${varName}.begin();\n`;
            codigo += `  Serial.println("✓ DHT22 en GPIO ${asig.pin} inicializado");\n`;
          }
          break;
        case 'distancia':
          codigo += `  pinMode(PIN_SENSOR_${varName}, INPUT);\n`;
          codigo += `  Serial.println("✓ Sensor ultrasónico en GPIO ${asig.pin} configurado");\n`;
          break;
        case 'luz':
          codigo += `  pinMode(PIN_SENSOR_${varName}, INPUT);\n`;
          codigo += `  Serial.println("✓ Sensor de luz en GPIO ${asig.pin} configurado");\n`;
          break;
      }
      codigo += '\n';
    });
    
    return codigo;
  }

  generarSetupActuadores() {
    let codigo = '';
    
    this.actuadoresAsignados.forEach(asig => {
      const def = this.definicionesActuadores.find(d => d.id === asig.definicionId);
      if (!def) return;
      
      const varName = this.sanitizarNombre(asig.alias || def.nombre);
      
      codigo += `  // Actuador: ${asig.alias || def.nombre} (${def.tipo})\n`;
      codigo += `  pinMode(PIN_ACTUADOR_${varName}, OUTPUT);\n`;
      codigo += `  digitalWrite(PIN_ACTUADOR_${varName}, LOW);\n`;
      codigo += `  Serial.println("✓ ${def.tipo} en GPIO ${asig.pin} configurado");\n\n`;
    });
    
    return codigo;
  }

  generarLoopLecturas() {
    let codigo = '  if (millis() - ultimaLectura > 5000) { // Leer cada 5 segundos\n';
    codigo += '    ultimaLectura = millis();\n\n';
    
    this.sensoresAsignados.forEach(asig => {
      const def = this.definicionesSensores.find(d => d.id === asig.definicionId);
      if (!def) return;
      
      const varName = this.sanitizarNombre(asig.alias || def.nombre);
      
      codigo += `    // Leer: ${asig.alias || def.nombre}\n`;
      
      switch (def.tipo) {
        case 'temperatura':
          if (def.protocolo === 'OneWire') {
            codigo += `    float temp_${varName} = dht_${varName}.readTemperature();\n`;
            codigo += `    if (!isnan(temp_${varName})) {\n`;
            codigo += `      enviarLectura(${asig.id}, temp_${varName}, "${def.unidad || '°C'}");\n`;
            codigo += `    }\n\n`;
          }
          break;
        case 'humedad':
          if (def.protocolo === 'OneWire') {
            codigo += `    float hum_${varName} = dht_${varName}.readHumidity();\n`;
            codigo += `    if (!isnan(hum_${varName})) {\n`;
            codigo += `      enviarLectura(${asig.id}, hum_${varName}, "${def.unidad || '%'}");\n`;
            codigo += `    }\n\n`;
          }
          break;
        case 'luz':
          codigo += `    int luz_${varName} = analogRead(PIN_SENSOR_${varName});\n`;
          codigo += `    enviarLectura(${asig.id}, luz_${varName}, "${def.unidad || 'lux'}");\n\n`;
          break;
      }
    });
    
    codigo += '  }\n';
    return codigo;
  }

  generarFuncionesAuxiliares() {
    return `
// Configurar conexión WiFi
void setupWiFi() {
  Serial.print("Conectando a WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n✓ WiFi conectado");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\\n✗ Error conectando WiFi");
  }
}

// Enviar lectura de sensor al servidor
void enviarLectura(int asignacionId, float valor, String unidad) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/sensor-asignaciones/" + String(asignacionId) + "/lectura";
  
  http.begin(wifiClient, url);
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\\"valor\\":" + String(valor, 2) + ",\\"unidad\\":\\"" + unidad + "\\"}";
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    Serial.printf("Lectura enviada (ID:%d): %.2f %s [%d]\\n", asignacionId, valor, unidad.c_str(), httpCode);
  } else {
    Serial.printf("Error enviando lectura: %s\\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}

// Procesar comandos del servidor
void procesarComandos() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/nodos/" + String(NODO_ID) + "/comandos-pendientes";
  
  http.begin(wifiClient, url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    // Parsear JSON y ejecutar comandos
    // TODO: Implementar parser de comandos
  }
  
  http.end();
}
`;
  }

  calcularIntervaloLectura() {
    // Usar el tiempo de lectura más corto de los sensores
    let minIntervalo = 5000; // Default 5 segundos
    
    this.sensoresAsignados.forEach(asig => {
      const def = this.definicionesSensores.find(d => d.id === asig.definicionId);
      if (def && def.tiempoLecturaMs) {
        minIntervalo = Math.min(minIntervalo, def.tiempoLecturaMs);
      }
    });
    
    return minIntervalo;
  }

  sanitizarNombre(nombre) {
    return nombre
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_');
  }

  // Guardar firmware generado
  guardarFirmware(outputDir) {
    const firmware = this.generarFirmware();
    const filename = `${this.sanitizarNombre(this.nodo.nombre)}_firmware.ino`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, firmware, 'utf8');
    
    return {
      filename,
      filepath,
      size: Buffer.byteLength(firmware, 'utf8')
    };
  }
}

module.exports = ESP32FirmwareGenerator;
