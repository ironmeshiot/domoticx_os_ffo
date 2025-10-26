// Sistema de monitoreo en tiempo real optimizado para Raspberry Pi
const { Server } = require('socket.io');
const { getDatabase } = require('../database/manager');

class MonitoreoTiempoReal {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.db = getDatabase();
    this.clientesConectados = new Map();
    this.intervalos = new Map();
    this.init();
  }

  init() {
    this.io.on('connection', (socket) => {
      console.log(`Cliente conectado: ${socket.id}`);
      this.clientesConectados.set(socket.id, {
        socket: socket,
        suscripciones: new Set()
      });

      // Enviar estado inicial
      this.enviarEstadoSistema(socket);

      // Suscribirse a actualizaciones de sensores específicos
      socket.on('suscribir_sensor', (sensorId) => {
        this.suscribirSensor(socket, sensorId);
      });

      // Desuscribirse de sensor
      socket.on('desuscribir_sensor', (sensorId) => {
        this.desuscribirSensor(socket, sensorId);
      });

      // Comando para actuador
      socket.on('comando_actuador', async (data) => {
        await this.ejecutarComandoActuador(data.actuadorId, data.comando, socket);
      });

      // Solicitar histórico de sensor
      socket.on('solicitar_historico', async (data) => {
        await this.enviarHistoricoSensor(socket, data.sensorId, data.limite);
      });

      socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
        this.limpiarCliente(socket.id);
      });
    });

    // Iniciar monitoreo de nodos
    this.iniciarMonitoreoNodos();
    
    // Iniciar limpieza automática cada hora
    setInterval(() => {
      this.db.limpiezaAutomatica();
    }, 60 * 60 * 1000);
  }

  async enviarEstadoSistema(socket) {
    try {
      const nodos = await this.db.obtenerNodos();
      const estadoSistema = {
        timestamp: new Date().toISOString(),
        nodos: nodos,
        estadoGeneral: this.calcularEstadoGeneral(nodos)
      };
      
      socket.emit('estado_sistema', estadoSistema);
    } catch (error) {
      console.error('Error enviando estado del sistema:', error);
    }
  }

  calcularEstadoGeneral(nodos) {
    const total = nodos.length;
    const online = nodos.filter(n => n.estado === 'online').length;
    const offline = nodos.filter(n => n.estado === 'offline').length;
    
    return {
      total_nodos: total,
      nodos_online: online,
      nodos_offline: offline,
      porcentaje_disponibilidad: total > 0 ? Math.round((online / total) * 100) : 0
    };
  }

  suscribirSensor(socket, sensorId) {
    const cliente = this.clientesConectados.get(socket.id);
    if (cliente) {
      cliente.suscripciones.add(sensorId);
      
      // Si es la primera suscripción a este sensor, iniciar monitoreo
      if (!this.intervalos.has(sensorId)) {
        this.iniciarMonitoreoSensor(sensorId);
      }
    }
  }

  desuscribirSensor(socket, sensorId) {
    const cliente = this.clientesConectados.get(socket.id);
    if (cliente) {
      cliente.suscripciones.delete(sensorId);
      
      // Si nadie más está suscrito, detener monitoreo
      const tieneOtrasSuscripciones = Array.from(this.clientesConectados.values())
        .some(c => c.suscripciones.has(sensorId));
      
      if (!tieneOtrasSuscripciones && this.intervalos.has(sensorId)) {
        clearInterval(this.intervalos.get(sensorId));
        this.intervalos.delete(sensorId);
      }
    }
  }

  iniciarMonitoreoSensor(sensorId) {
    // Monitoreo cada 5 segundos (ajustable según necesidades)
    const intervalo = setInterval(async () => {
      try {
        const lecturas = await this.db.obtenerLecturasRecientes(sensorId, 1);
        if (lecturas.length > 0) {
          const lectura = lecturas[0];
          this.difundirDatoSensor(sensorId, lectura);
        }
      } catch (error) {
        console.error(`Error monitoreando sensor ${sensorId}:`, error);
      }
    }, 5000);

    this.intervalos.set(sensorId, intervalo);
  }

  difundirDatoSensor(sensorId, lectura) {
    // Enviar solo a clientes suscritos a este sensor
    for (const [socketId, cliente] of this.clientesConectados) {
      if (cliente.suscripciones.has(sensorId)) {
        cliente.socket.emit('dato_sensor', {
          sensor_id: sensorId,
          valor: lectura.valor,
          timestamp: lectura.timestamp
        });
      }
    }
  }

  async ejecutarComandoActuador(actuadorId, comando, socket) {
    try {
      await this.db.enviarComandoActuador(actuadorId, comando);
      
      // Aquí se enviaría el comando al nodo ESP físico
      // Por ahora simulamos la ejecución
      const resultado = {
        actuador_id: actuadorId,
        comando: comando,
        estado: 'ejecutado',
        timestamp: new Date().toISOString()
      };

      socket.emit('resultado_comando', resultado);
      
      // Difundir cambio de estado a otros clientes
      socket.broadcast.emit('cambio_actuador', resultado);

    } catch (error) {
      console.error('Error ejecutando comando:', error);
      socket.emit('error_comando', {
        actuador_id: actuadorId,
        error: error.message
      });
    }
  }

  async enviarHistoricoSensor(socket, sensorId, limite = 100) {
    try {
      const lecturas = await this.db.obtenerLecturasRecientes(sensorId, limite);
      socket.emit('historico_sensor', {
        sensor_id: sensorId,
        lecturas: lecturas
      });
    } catch (error) {
      console.error('Error obteniendo histórico:', error);
      socket.emit('error', { mensaje: 'Error obteniendo histórico de sensor' });
    }
  }

  iniciarMonitoreoNodos() {
    // Verificar estado de nodos cada 30 segundos
    setInterval(async () => {
      try {
        const nodos = await this.db.obtenerNodos();
        for (const nodo of nodos) {
          // Aquí se haría ping real a los nodos ESP
          // Por ahora simulamos
          const estadoAnterior = nodo.estado;
          const nuevoEstado = Math.random() > 0.1 ? 'online' : 'offline'; // 90% probabilidad online
          
          if (estadoAnterior !== nuevoEstado) {
            await this.db.actualizarEstadoNodo(nodo.id, nuevoEstado);
            
            // Notificar cambio de estado
            this.io.emit('cambio_estado_nodo', {
              nodo_id: nodo.id,
              nombre: nodo.nombre,
              estado_anterior: estadoAnterior,
              estado_nuevo: nuevoEstado,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error monitoreando nodos:', error);
      }
    }, 30000);
  }

  limpiarCliente(socketId) {
    const cliente = this.clientesConectados.get(socketId);
    if (cliente) {
      // Verificar si algún sensor quedó sin suscriptores
      for (const sensorId of cliente.suscripciones) {
        const tieneOtrasSuscripciones = Array.from(this.clientesConectados.values())
          .filter(c => c.socket.id !== socketId)
          .some(c => c.suscripciones.has(sensorId));
        
        if (!tieneOtrasSuscripciones && this.intervalos.has(sensorId)) {
          clearInterval(this.intervalos.get(sensorId));
          this.intervalos.delete(sensorId);
        }
      }
      
      this.clientesConectados.delete(socketId);
    }
  }

  // Método para simular datos de sensores (para pruebas)
  simularDatosSensores() {
    setInterval(async () => {
      try {
        // Simular lectura de temperatura (sensor ID 1)
        const temperatura = 20 + Math.random() * 10;
        await this.db.insertarLectura(1, temperatura);
        
        // Simular lectura de humedad (sensor ID 2)  
        const humedad = 40 + Math.random() * 30;
        await this.db.insertarLectura(2, humedad);
        
      } catch (error) {
        console.error('Error simulando datos:', error);
      }
    }, 10000); // Cada 10 segundos
  }
}

module.exports = MonitoreoTiempoReal;