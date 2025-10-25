// Servicio para interactuar con la API de widgets del dashboard
const API_URL = '/api/widgets';

export async function guardarConfigWidgets(config) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widgets: config })
  });
  if (!res.ok) throw new Error('Error al guardar configuración');
  return await res.json();
}

export async function cargarConfigWidgets() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Error al cargar configuración');
  return await res.json();
}
