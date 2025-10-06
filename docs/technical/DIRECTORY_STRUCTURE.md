# DomoticX OS FFO - Directory Structure

```
Domoticx_OS_FFO/
├── src/                        # Source code root directory
│   ├── server/                # Server-side application code
│   │   ├── core/             # Core server functionality
│   │   │   ├── auth/        # Authentication and authorization
│   │   │   ├── config/      # Server configuration handlers
│   │   │   └── middleware/  # Express middleware
│   │   ├── api/             # API routes and controllers
│   │   │   ├── v1/         # Version 1 API endpoints
│   │   │   └── middleware/ # API-specific middleware
│   │   ├── services/        # Business logic and services
│   │   └── utils/          # Utility functions and helpers
│   │
│   ├── hardware/            # Hardware integration and management
│   │   ├── drivers/        # Device-specific drivers
│   │   ├── mesh/          # Mesh network implementation
│   │   │   ├── wifi/      # WiFi mesh networking
│   │   │   ├── espnow/    # ESP-NOW protocol implementation
│   │   │   └── lora/      # LoRa communication
│   │   ├── sensors/       # Sensor management
│   │   └── controllers/   # Hardware controllers
│   │
│   ├── frontend/           # Frontend application
│   │   ├── components/    # React/Vue components
│   │   ├── pages/        # Page components
│   │   ├── assets/       # Static assets
│   │   │   ├── images/   # Image assets
│   │   │   └── styles/   # CSS/SCSS files
│   │   ├── services/     # Frontend services
│   │   └── utils/        # Frontend utilities
│   │
│   ├── ai_assistant/      # AI integration
│   │   ├── core/         # Core AI functionality
│   │   ├── models/       # AI models and training
│   │   ├── nlp/         # Natural language processing
│   │   └── services/     # AI services
│   │
│   └── database/         # Database management
│       ├── migrations/   # Database migrations
│       ├── models/       # Database models
│       └── seeds/        # Seed data
│
├── docs/                  # Documentation
│   ├── technical/        # Technical documentation
│   │   ├── architecture/  # System architecture
│   │   ├── api/          # API documentation
│   │   └── deployment/   # Deployment guides
│   ├── user/            # User documentation
│   │   ├── guides/      # User guides
│   │   └── tutorials/   # User tutorials
│   ├── api/             # API documentation
│   │   ├── v1/         # Version 1 API docs
│   │   └── examples/   # API usage examples
│   └── hardware/        # Hardware documentation
│       ├── setup/      # Hardware setup guides
│       └── diagrams/   # Hardware diagrams
│
├── config/              # Configuration files
│   ├── default/        # Default configurations
│   ├── development/    # Development environment
│   ├── production/     # Production environment
│   └── test/          # Test environment
│
├── tests/              # Testing
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   ├── e2e/          # End-to-end tests
│   └── fixtures/      # Test fixtures
│
├── scripts/           # Utility scripts
│   ├── setup/        # Setup scripts
│   ├── deploy/       # Deployment scripts
│   └── maintenance/  # Maintenance scripts
│
└── tools/            # Development tools
    ├── generators/   # Code generators
    └── debugging/    # Debugging tools
```

## Directory Descriptions

### /src
The source code root directory contains all the application code organized by domain.

#### /src/server
The server-side application code, implementing the core backend functionality.
- `core/`: Essential server functionality
- `api/`: REST API implementation
- `services/`: Business logic implementation
- `utils/`: Helper functions and utilities

#### /src/hardware
Hardware integration and management code for all physical devices.
- `drivers/`: Device-specific implementations
- `mesh/`: Mesh network protocols (WiFi, ESP-NOW, LoRa)
- `sensors/`: Sensor management and integration
- `controllers/`: Hardware control logic

#### /src/frontend
Frontend application code and assets.
- `components/`: Reusable UI components
- `pages/`: Page-level components
- `assets/`: Static resources
- `services/`: Frontend services
- `utils/`: Frontend utilities

#### /src/ai_assistant
AI integration and intelligent automation.
- `core/`: Core AI functionality
- `models/`: AI/ML models
- `nlp/`: Natural language processing
- `services/`: AI services

#### /src/database
Database management and data models.
- `migrations/`: Database schema migrations
- `models/`: Data models
- `seeds/`: Initial data seeds

### /docs
Project documentation organized by type and audience.
- `technical/`: Technical documentation
- `user/`: End-user documentation
- `api/`: API documentation
- `hardware/`: Hardware setup and configuration

### /config
Environment-specific configuration files.
- `default/`: Default configuration
- `development/`: Development environment settings
- `production/`: Production environment settings
- `test/`: Test environment configuration

### /tests
Test suites organized by test type.
- `unit/`: Unit tests
- `integration/`: Integration tests
- `e2e/`: End-to-end tests
- `fixtures/`: Test data and fixtures

### /scripts
Utility scripts for various operations.
- `setup/`: System setup scripts
- `deploy/`: Deployment automation
- `maintenance/`: System maintenance tasks

### /tools
Development tools and utilities.
- `generators/`: Code generation tools
- `debugging/`: Debugging utilities

## Usage Guidelines

1. Each directory should contain a README.md file explaining its specific purpose
2. Follow the established structure when adding new features
3. Maintain separation of concerns between different directories
4. Keep related files together within their respective domains
5. Use appropriate subdirectories for better organization

## Best Practices

1. Keep directory names lowercase and use underscores for spaces
2. Use clear, descriptive names for directories and files
3. Maintain consistent structure across similar components
4. Document any structural changes in this guide
5. Follow the established naming conventions for each directory