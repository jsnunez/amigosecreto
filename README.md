# 🎁 Amigo Secreto

Aplicación web para organizar intercambios de "Amigo Secreto" con conexión a base de datos MySQL.

## 🚀 Características

- **Sistema de autenticación**: Login y registro de usuarios
- **Panel de administración**: Control total sobre los juegos
- **Asignaciones automáticas**: Algoritmo que genera parejas aleatorias
- **Seguridad**: Las asignaciones no se pueden cambiar una vez generadas
- **Interfaz moderna**: Diseño responsive con Bootstrap

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js con Express
- **Base de datos**: MySQL
- **Autenticación**: bcrypt para hash de contraseñas
- **Sesiones**: express-session
- **Vistas**: EJS (Embedded JavaScript)
- **Estilos**: Bootstrap 5

## 📋 Requisitos Previos

- Node.js (versión 14 o superior)
- MySQL Server
- npm o yarn

## 🔧 Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar la base de datos**:
   - Crear una base de datos MySQL llamada `amigo_secreto`
   - Ejecutar el archivo `database/init.sql` en MySQL
   - O dejar que la aplicación cree las tablas automáticamente

3. **Configurar variables de entorno**:
   - Editar el archivo `.env` con tus credenciales de MySQL:
   ```
   DB_HOST=localhost
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   DB_NAME=amigo_secreto
   DB_PORT=3306
   SESSION_SECRET=tu_clave_secreta_muy_segura
   ```

4. **Iniciar la aplicación**:
   ```bash
   npm start
   ```
   
   Para desarrollo (con auto-recarga):
   ```bash
   npm run dev
   ```

## 🎮 Uso de la Aplicación

### Para Usuarios

1. **Registro**: Crear cuenta en `/register`
2. **Login**: Iniciar sesión en `/login`
3. **Dashboard**: Ver tu asignación cuando el juego esté activo
4. **Importante**: No puedes cambiar tu asignación una vez generada

### Para Administradores

1. **Login con credenciales de admin**:
   - Usuario: `admin`
   - Contraseña: `admin123`

2. **Panel de administración** (`/admin`):
   - Crear nuevos juegos
   - Activar juegos (genera asignaciones automáticamente)
   - Ver estadísticas de usuarios
   - Gestionar todos los juegos

## 🗂️ Estructura del Proyecto

```
amigo-secreto/
├── database/
│   └── init.sql              # Script de inicialización de BD
├── views/
│   ├── login.ejs            # Página de login
│   ├── register.ejs         # Página de registro
│   ├── dashboard.ejs        # Dashboard principal
│   └── admin.ejs           # Panel de administración
├── .env                    # Variables de entorno
├── server.js              # Servidor principal
├── package.json          # Dependencias y scripts
└── README.md            # Este archivo
```

## 🔐 Seguridad

- **Contraseñas hasheadas** con bcrypt
- **Sesiones seguras** con express-session
- **Validación de permisos** para rutas de administrador
- **Prevención de cambios** en asignaciones una vez generadas

## 🎯 Funcionalidades Principales

### Sistema de Usuarios
- Registro y login con validación
- Diferenciación entre usuarios normales y administradores
- Gestión segura de sesiones

### Gestión de Juegos
- Crear múltiples juegos con nombres personalizados
- Solo un juego puede estar activo a la vez
- Activación controlada por administrador

### 🧠 Algoritmo Inteligente de Asignaciones
- **Prevención garantizada de auto-asignaciones**: Sistema multicapa que asegura que ningún usuario sea su propio amigo secreto
- **Algoritmo de re-intentos**: Hasta 100 intentos automáticos para generar una combinación válida
- **Validación a nivel de aplicación**: Verificación en el código antes de guardar
- **Restricción de base de datos**: CHECK constraint `user_id != assigned_to` como última línea de defensa
- **Distribución completamente aleatoria**: Cada activación genera combinaciones únicas e impredecibles
- **Ciclo perfecto**: Garantiza que todos dan y reciben exactamente un regalo

## 🚦 Estados de la Aplicación

- **Sin juego activo**: Los usuarios ven un mensaje informativo
- **Juego activo sin asignaciones**: Los usuarios esperan que el admin genere asignaciones
- **Juego activo con asignaciones**: Los usuarios ven a quién le deben regalar

## 🔧 Scripts Disponibles

- `npm start`: Iniciar la aplicación
- `npm run dev`: Iniciar en modo desarrollo con nodemon

## 🐛 Solución de Problemas

### Error de conexión a la base de datos
- Verificar que MySQL esté ejecutándose
- Confirmar credenciales en `.env`
- Verificar que la base de datos `amigo_secreto` exista

### No se pueden generar asignaciones
- Se necesitan al menos 2 usuarios (no administradores) para generar asignaciones
- Verificar que hay usuarios registrados en el sistema

### Problemas de permisos
- Solo los administradores pueden acceder a `/admin`
- Verificar que el usuario tenga `is_admin = TRUE` en la base de datos

## 📝 Notas Importantes

- **Una sola activación por juego**: Una vez que se activa un juego y se generan las asignaciones, no se pueden cambiar
- **Solo un juego activo**: Al activar un nuevo juego, todos los demás se desactivan automáticamente
- **Admin por defecto**: Se crea automáticamente un usuario admin con credenciales `admin/admin123`

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

¡Disfruta organizando tu intercambio de Amigo Secreto! 🎁🎉