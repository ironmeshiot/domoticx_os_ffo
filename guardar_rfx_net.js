// SOLUCIÓN RÁPIDA: Guardar RFX_NET directamente
const { getDatabase } = require('./src/server/database/manager');

async function guardarRFXNET() {
  const db = getDatabase();
  
  try {
    console.log('💾 GUARDANDO RFX_NET DIRECTAMENTE...');
    
    // Guardar RFX_NET en el nodo Sotano (ID: 5)
    await db.actualizarConfiguracionNodo(5, {
      ssid: 'RFX_NET',
      password: 'tu_password_aqui',  // Cambia por tu password
      canal: 1,
      modo_red: 'wifi'
    });
    
    console.log('✅ RFX_NET guardado para nodo Sotano');
    
    // Verificar
    const nodo = await db.obtenerNodoPorId(5);
    console.log(`📄 Verificación: SSID=${nodo.ssid}, Pass=${nodo.wifiPass}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
    process.exit(0);
  }
}

guardarRFXNET();