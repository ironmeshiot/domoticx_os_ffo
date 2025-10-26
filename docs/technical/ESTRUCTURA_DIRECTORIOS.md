# DomoticX OS FFO - Estructura de Directorios

```
Domoticx_OS_FFO ( Full Failover)
├── src/                    # Directorio raíz del código fuente
│   ├── server/             # Código del servidor
│   │   ├── core/           # Funcionalidad central del servidor
│   │   │   ├── auth/       # Autenticación y autorización
│   │   │   ├── config/     # Manejadores de configuración
│   │   │   └── middleware/  # Middleware de Express
│   │   ├── api/             # Rutas y controladores API
│   │   │   ├── v1/          # Endpoints API versión 1
│   │   │   └── middleware/  # Middleware específico de API
│   │   ├── services/        # Lógica de negocio y servicios
│   │   └── utils/           # Funciones y utilidades
│   │
│   ├── hardware/            # Integración y gestión de hardware
│   │   ├── drivers/         # Controladores específicos de dispositivos
│   │   ├── mesh/            # Implementación de red mesh
│   │   │   ├── wifi/        # Red mesh WiFi
│   │   │   ├── espnow/      # Implementación protocolo ESP-NOW
│   │   │   └── lora/        # Comunicación LoRa
│   │   ├── sensors/         # Gestión de sensores
│   │   └── controllers/     # Controladores de hardware
│   │
│   ├── frontend/            # Aplicación frontend
│   │   ├── components/      # Componentes React/Vue
│   │   ├── pages/           # Componentes de página
│   │   ├── assets/          # Recursos estáticos
│   │   │   ├── images/      # Imágenes
│   │   │   └── styles/      # Archivos CSS/SCSS
│   │   ├── services/        # Servicios frontend
│   │   └── utils/           # Utilidades frontend
│   │
│   ├── ai_assistant/        # Integración de IA
│   │   ├── core/            # Funcionalidad central de IA
│   │   ├── models/          # Modelos de IA y entrenamiento
│   │   ├── nlp/             # Procesamiento de lenguaje natural
│   │   └── services/        # Servicios de IA
│   │
│   └── database/            # Gestión de base de datos
│       ├── migrations/      # Migraciones de base de datos
│       ├── models/          # Modelos de datos
│       └── seeds/           # Datos de inicialización
│
├── docs/                    # Documentación
│   ├── technical/           # Documentación técnica
│   │   ├── architecture/    # Arquitectura del sistema
│   │   ├── api/             # Documentación API
│   │   └── deployment/      # Guías de implementación
│   ├── user/                # Documentación de usuario
│   │   ├── guides/          # Guías de usuario
│   │   └── tutorials/       # Tutoriales
│   ├── api/                 # Documentación API
│   │   ├── v1/              # Docs API versión 1
│   │   └── examples/        # Ejemplos de uso API
│   └── hardware/            # Documentación de hardware
│       ├── setup/           # Guías de configuración
│       └── diagrams/        # Diagramas de hardware
│
├── config/                  # Archivos de configuración
│   ├── default/             # Configuraciones por defecto
│   ├── development/         # Entorno de desarrollo
│   ├── production/          # Entorno de producción
│   └── test/                # Entorno de pruebas
│
├── tests/                   # Pruebas
│   ├── unit/                # Pruebas unitarias
│   ├── integration/         # Pruebas de integración
│   ├── e2e/                 # Pruebas end-to-end
│   └── fixtures/            # Datos de prueba
│
├── scripts/                 # Scripts de utilidad
│   ├── setup/               # Scripts de configuración
│   ├── deploy/              # Scripts de implementación
│   └── maintenance/         # Scripts de mantenimiento
│
└── tools/                   # Herramientas de desarrollo
    ├── generators/          # Generadores de código
    └── debugging/           # Herramientas de depuración
```

## Descripción de Directorios

### /src
El directorio raíz del código fuente contiene todo el código de la aplicación organizado por dominio.

#### /src/server
El código del servidor, implementando la funcionalidad backend principal.
- `core/`: Funcionalidad esencial del servidor
- `api/`: Implementación REST API
- `services/`: Implementación de lógica de negocio
- `utils/`: Funciones auxiliares y utilidades

#### /src/hardware
Código de integración y gestión de hardware para todos los dispositivos físicos.
- `drivers/`: Implementaciones específicas de dispositivos
- `mesh/`: Protocolos de red mesh (WiFi, ESP-NOW, LoRa)
- `sensors/`: Gestión e integración de sensores
- `controllers/`: Lógica de control de hardware

#### /src/frontend
Código y recursos de la aplicación frontend.
- `components/`: Componentes UI reutilizables
- `pages/`: Componentes a nivel de página
- `assets/`: Recursos estáticos
- `services/`: Servicios frontend
- `utils/`: Utilidades frontend

#### /src/ai_assistant
Integración de IA y automatización inteligente.
- `core/`: Funcionalidad central de IA
- `models/`: Modelos de IA/ML
- `nlp/`: Procesamiento de lenguaje natural
- `services/`: Servicios de IA

#### /src/database
Gestión de base de datos y modelos de datos.
- `migrations/`: Migraciones de esquema
- `models/`: Modelos de datos
- `seeds/`: Datos iniciales

### /docs
Documentación del proyecto organizada por tipo y audiencia.
- `technical/`: Documentación técnica
- `user/`: Documentación para usuario final
- `api/`: Documentación API
- `hardware/`: Configuración de hardware

### /config
Archivos de configuración específicos por entorno.
- `default/`: Configuración por defecto
- `development/`: Configuración de desarrollo
- `production/`: Configuración de producción
- `test/`: Configuración de pruebas

### /tests
Conjuntos de pruebas organizados por tipo.
- `unit/`: Pruebas unitarias
- `integration/`: Pruebas de integración
- `e2e/`: Pruebas end-to-end
- `fixtures/`: Datos y recursos para pruebas

### /scripts
Scripts de utilidad para varias operaciones.
- `setup/`: Scripts de configuración del sistema
- `deploy/`: Automatización de despliegue
- `maintenance/`: Tareas de mantenimiento

### /tools
Herramientas de desarrollo y utilidades.
- `generators/`: Herramientas de generación de código
- `debugging/`: Utilidades de depuración

## Guías de Uso

1. Cada directorio debe contener un archivo README.md explicando su propósito específico
2. Seguir la estructura establecida al agregar nuevas características
3. Mantener la separación de responsabilidades entre directorios
4. Mantener archivos relacionados juntos dentro de sus respectivos dominios
5. Usar subdirectorios apropiados para mejor organización

## Mejores Prácticas

1. Mantener nombres de directorios en minúsculas y usar guiones bajos para espacios
2. Usar nombres claros y descriptivos para directorios y archivos
3. Mantener estructura consistente entre componentes similares
4. Documentar cualquier cambio estructural en esta guía
5. Seguir las convenciones de nomenclatura establecidas para cada directorio