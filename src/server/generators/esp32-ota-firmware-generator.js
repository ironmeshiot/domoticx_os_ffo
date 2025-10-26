// Generador de firmware ESP32 con soporte OTA (Over-The-Air Updates)
const fs = require('fs');
const path = require('path');

class ESP32OTAFirmwareGenerator {
  constructor(nodo, sensoresAsignados, actuadoresAsignados, definicionesSensores, definicionesActuadores, serverIP = '192.168.1.100', wifiSSID = 'TU_WIFI', wifiPassword = 'TU_PASSWORD') {
    this.nodo = nodo;
    this.sensoresAsignados = sensoresAsignados;
    this.actuadoresAsignados = actuadoresAsignados;
    this.definicionesSensores = definicionesSensores;
    this.definicionesActuadores = definicionesActuadores;
    this.serverIP = serverIP;
    this.wifiSSID = wifiSSID;
    this.wifiPassword = wifiPassword;
    this.firmwareVersion = Date.now(); // Timestamp como versión
  }

  // Generar código Arduino/PlatformIO con OTA
  generarFirmware() {
    const includes = this.generarIncludes();
    const definiciones = this.generarDefiniciones();
    const variablesGlobales = this.generarVariablesGlobales();
    const setupOTA = this.generarSetupOTA();
    const setupSensores = this.generarSetupSensores();
    const setupActuadores = this.generarSetupActuadores();
    const loopLecturas = this.generarLoopLecturas();
    const funcionesAuxiliares = this.generarFuncionesAuxiliares();
    const funcionesOTA = this.generarFuncionesOTA();

    return `
/*
 * Firmware Auto-Generado con OTA para ${this.nodo.nombre}
 * Tipo: ${this.nodo.tipo}
 * Ubicación: ${this.nodo.ubicacion || 'No especificada'}
 * Versión: ${this.firmwareVersion}
 * 
 * Generado automáticamente por DomoticX OS FFO
 * Soporta actualización remota OTA (Over-The-Air)
 */

${includes}

${definiciones}

${variablesGlobales}

void setup() {
  Serial.begin(115200);
  Serial.println("\\n=== Iniciando ${this.nodo.nombre} ===");
  Serial.println("Versión: ${this.firmwareVersion}");
  
  // Configurar WiFi
  setupWiFi();
  
  // Configurar OTA
${setupOTA}
  
  // Configurar sensores
${setupSensores}
  
  // Configurar actuadores
${setupActuadores}
  
  // Registrar nodo en servidor
  registrarNodo();
  
  Serial.println("=== Nodo listo ===");
}

void loop() {
  // Mantener conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado, reconectando...");
    setupWiFi();
  }
  
  // Procesar OTA en background
  ArduinoOTA.handle();
  
  // Verificar actualizaciones cada 5 minutos
  if (millis() - ultimaVerificacionOTA > 300000) {
    verificarActualizacion();
    ultimaVerificacionOTA = millis();
  }
  
  // Leer sensores y enviar al servidor
${loopLecturas}
  
  // Procesar comandos del servidor
  procesarComandos();
  
  delay(${this.calcularIntervaloLectura()});
}

${funcionesAuxiliares}

${funcionesOTA}
`;
  }

  generarIncludes() {
    const libs = new Set([
      'WiFi.h',
      'HTTPClient.h',
      'ArduinoJson.h',
      'HTTPUpdate.h',      // Para OTA HTTP
      'ArduinoOTA.h'       // Para OTA básico
    ]);
    
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
      }
    });
    
    return Array.from(libs).map(lib => `#include <${lib}>`).join('\n');
  }

  generarDefiniciones() {
    let codigo = '\n// Configuración del servidor\n';
    codigo += `#define SERVER_IP "${this.serverIP}"\n`;
    codigo += `#define SERVER_PORT 4000\n`;
    codigo += `#define NODO_ID ${this.nodo.id}\n`;
    codigo += `#define NODO_NOMBRE "${this.nodo.nombre}"\n`;
    codigo += `#define FIRMWARE_VERSION "${this.firmwareVersion}"\n\n`;
    
    codigo += '// Configuración WiFi\n';
    codigo += `#define WIFI_SSID "${this.wifiSSID}"\n`;
    codigo += `#define WIFI_PASSWORD "${this.wifiPassword}"\n\n`;
    
    codigo += '// Configuración OTA\n';
    codigo += '#define OTA_PASSWORD "domoticx2025"  // Contraseña para OTA\n';
    codigo += `#define OTA_URL "http://${this.serverIP}:4000/api/firmware/"\n\n`;
    
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
    codigo += 'unsigned long ultimaLectura = 0;\n';
    codigo += 'unsigned long ultimaVerificacionOTA = 0;\n';
    codigo += 'bool otaEnProgreso = false;\n\n';
    
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

  generarSetupOTA() {
    return `  // Configurar OTA
  ArduinoOTA.setHostname(NODO_NOMBRE);
  ArduinoOTA.setPassword(OTA_PASSWORD);
  
  ArduinoOTA.onStart([]() {
    otaEnProgreso = true;
    String tipo = (ArduinoOTA.getCommand() == U_FLASH) ? "sketch" : "filesystem";
    Serial.println("Iniciando actualización OTA: " + tipo);
  });
  
  ArduinoOTA.onEnd([]() {
    Serial.println("\\n✓ Actualización OTA completada");
    otaEnProgreso = false;
  });
  
  ArduinoOTA.onProgress([](unsigned int progreso, unsigned int total) {
    Serial.printf("Progreso OTA: %u%%\\r", (progreso / (total / 100)));
  });
  
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error OTA [%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Fallo autenticación");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Fallo inicio");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Fallo conexión");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Fallo recepción");
    else if (error == OTA_END_ERROR) Serial.println("Fallo finalización");
    otaEnProgreso = false;
  });
  
  ArduinoOTA.begin();
  Serial.println("✓ OTA habilitado");
`;
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
  WiFi.setHostname(NODO_NOMBRE);
  
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n✓ WiFi conectado exitosamente");
    Serial.println("📡 Información de red:");
    Serial.print("   SSID: ");
    Serial.println(WiFi.SSID());
    Serial.print("   IP asignada por DHCP: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Gateway: ");
    Serial.println(WiFi.gatewayIP());
    Serial.print("   DNS: ");
    Serial.println(WiFi.dnsIP());
    Serial.print("   MAC: ");
    Serial.println(WiFi.macAddress());
    Serial.print("   Intensidad señal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\\n✗ Error conectando WiFi");
    Serial.println("💡 Verifica credenciales y cobertura");
  }
}

// Registrar nodo en el servidor
void registrarNodo() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/nodos/" + String(NODO_ID) + "/registro";
  
  http.begin(wifiClient, url);
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\\"nombre\\":\\"" + String(NODO_NOMBRE) + "\\",";
  payload += "\\"firmwareVersion\\":\\"" + String(FIRMWARE_VERSION) + "\\",";
  payload += "\\"ipAddress\\":\\"" + WiFi.localIP().toString() + "\\",";
  payload += "\\"macAddress\\":\\"" + WiFi.macAddress() + "\\"}";
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    Serial.println("✓ Nodo registrado en servidor");
  } else {
    Serial.println("✗ Error registrando nodo");
  }
  
  http.end();
}

// Enviar lectura de sensor al servidor
void enviarLectura(int asignacionId, float valor, String unidad) {
  if (WiFi.status() != WL_CONNECTED || otaEnProgreso) return;
  
  HTTPClient http;
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/sensor-asignaciones/" + String(asignacionId) + "/lectura";
  
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
  if (WiFi.status() != WL_CONNECTED || otaEnProgreso) return;
  
  HTTPClient http;
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/nodos/" + String(NODO_ID) + "/comandos-pendientes";
  
  http.begin(wifiClient, url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    // Parsear JSON y ejecutar comandos
    // Si hay comando de actualización OTA, ejecutar
    if (payload.indexOf("\\"ota\\"") > 0) {
      Serial.println("📥 Comando OTA recibido");
      iniciarActualizacionOTA();
    }
  }
  
  http.end();
}
`;
  }

  generarFuncionesOTA() {
    return `
// Verificar si hay actualización disponible
void verificarActualizacion() {
  if (WiFi.status() != WL_CONNECTED || otaEnProgreso) return;
  
  HTTPClient http;
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/nodos/" + String(NODO_ID) + "/firmware-disponible";
  
  http.begin(wifiClient, url);
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    
    // Parsear JSON para ver si hay nueva versión
    if (response.indexOf("\\"disponible\\":true") > 0) {
      Serial.println("🔄 Nueva versión de firmware disponible");
      // La actualización se ejecutará cuando el servidor envíe el comando
    }
  }
  
  http.end();
}

// Iniciar actualización OTA desde servidor
void iniciarActualizacionOTA() {
  if (otaEnProgreso) return;
  
  otaEnProgreso = true;
  Serial.println("\\n=== Iniciando actualización OTA ===");
  
  String firmwareURL = String(OTA_URL) + String(NODO_ID) + "/firmware.bin";
  
  WiFiClient client;
  httpUpdate.setLedPin(LED_BUILTIN, LOW);
  
  t_httpUpdate_return ret = httpUpdate.update(client, firmwareURL);
  
  switch (ret) {
    case HTTP_UPDATE_FAILED:
      Serial.printf("✗ Error OTA: %s\\n", httpUpdate.getLastErrorString().c_str());
      otaEnProgreso = false;
      break;
      
    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("✓ Ya estás en la última versión");
      otaEnProgreso = false;
      break;
      
    case HTTP_UPDATE_OK:
      Serial.println("✓ Actualización exitosa. Reiniciando...");
      // El ESP32 se reinicia automáticamente
      break;
  }
}
`;
  }

  calcularIntervaloLectura() {
    let minIntervalo = 5000;
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

  // Generar PlatformIO configuration
  generarPlatformIOIni() {
    return `
; PlatformIO Project Configuration File para ${this.nodo.nombre}
; Generado automáticamente por DomoticX OS FFO

[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200

; Librerías requeridas
lib_deps = 
    bblanchon/ArduinoJson@^6.21.0
    adafruit/DHT sensor library@^1.4.4
    adafruit/Adafruit Unified Sensor@^1.1.6

; Configuración OTA
upload_protocol = espota
upload_port = ${this.nodo.ipAddress || '192.168.1.100'}
upload_flags = 
    --auth=domoticx2025
    --port=3232
`;
  }
}

module.exports = ESP32OTAFirmwareGenerator;
