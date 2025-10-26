// Script para inicializar datos de prueba en la base de datos
const { getDatabase } = require('./src/server/database/manager');

async function inicializarDatosPrueba() {
  try {
    const db = getDatabase();

    console.log('Inicializando datos de prueba...');

    // Agregar nodos de prueba
    const nodo1 = await db.insertarNodo({
      nombre: 'Nodo Cocina',
      tipo: 'ESP32',
      mac_address: '24:6F:28:12:34:56',
      ip_address: '192.168.1.100',
      ubicacion: 'Cocina'
    });

    const nodo2 = await db.insertarNodo({
      nombre: 'Nodo Living',
      tipo: 'ESP8266',
      mac_address: '5C:CF:7F:AB:CD:EF',
      ip_address: '192.168.1.101',
      ubicacion: 'Living'
    });

    console.log(`Nodos creados: ${nodo1}, ${nodo2}`);

    // Agregar sensores de prueba
    await db.insertarSensor({
      nodo_id: nodo1,
      nombre: 'Temperatura Cocina',
      tipo: 'temperatura',
      pin: 'A0',
      unidad: '°C',
      min_valor: -10,
      max_valor: 50,
      calibracion: JSON.stringify({ offset: 0, multiplicador: 1 })
    });

    await db.insertarSensor({
      nodo_id: nodo1,
      nombre: 'Humedad Cocina',
      tipo: 'humedad',
      pin: 'A1',
      unidad: '%',
      min_valor: 0,
      max_valor: 100,
      calibracion: JSON.stringify({ offset: 0, multiplicador: 1 })
    });

    await db.insertarSensor({
      nodo_id: nodo2,
      nombre: 'Movimiento Living',
      tipo: 'movimiento',
      pin: 'D1',
      unidad: 'bool',
      min_valor: 0,
      max_valor: 1,
      calibracion: JSON.stringify({ offset: 0, multiplicador: 1 })
    });

    // Agregar actuadores de prueba
    await db.insertarActuador({
      nodo_id: nodo1,
      nombre: 'Luz Cocina',
      tipo: 'relay',
      pin: 'D2',
      configuracion: JSON.stringify({
        voltaje: 220,
        corriente_max: 2,
        inversion_logica: false
      })
    });

    await db.insertarActuador({
      nodo_id: nodo2,
      nombre: 'Ventilador Living',
      tipo: 'relay',
      pin: 'D3',
      configuracion: JSON.stringify({
        voltaje: 12,
        corriente_max: 1.5,
        inversion_logica: false
      })
    });

    // Agregar algunas lecturas de sensores
    for (let i = 0; i < 20; i++) {
      await db.insertarLectura(1, 20 + Math.random() * 10); // Temperatura
      await db.insertarLectura(2, 40 + Math.random() * 30); // Humedad
      await db.insertarLectura(3, Math.random() > 0.8 ? 1 : 0); // Movimiento
    }

    console.log('Datos de prueba inicializados correctamente!');
    console.log('Puedes ver los sensores en: http://localhost:3000');
    console.log('APIs disponibles en: http://localhost:4000/api/nodos');

  } catch (error) {
    console.error('Error inicializando datos:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  inicializarDatosPrueba();
}

module.exports = { inicializarDatosPrueba };