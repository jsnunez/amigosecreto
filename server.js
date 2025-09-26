const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Configuración de la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectTimeout: 60000
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        console.error('Host:', process.env.DB_HOST);
        console.error('User:', process.env.DB_USER);
        console.error('Database:', process.env.DB_NAME);
        console.error('Port:', process.env.DB_PORT);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
    
    // Crear tablas si no existen
    initializeDatabase();
});

// Manejo de errores de conexión
db.on('error', function(err) {
    console.error('Error de conexión a la base de datos:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.log('Intentando reconectar...');
        db.connect();
    } else {
        throw err;
    }
});

// Función para inicializar la base de datos
function initializeDatabase() {
    console.log('Inicializando base de datos...');
    
    // Crear tabla de usuarios
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `;
    
    // Crear tabla de juegos
    const createGamesTable = `
        CREATE TABLE IF NOT EXISTS games (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            is_active BOOLEAN DEFAULT FALSE,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB
    `;
    
    // Crear tabla de participantes
    const createParticipantsTable = `
        CREATE TABLE IF NOT EXISTS participants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            game_id INT,
            assigned_to INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_game (user_id, game_id)
        ) ENGINE=InnoDB
    `;
    
    db.query(createUsersTable, (err) => {
        if (err) {
            console.error('Error creando tabla users:', err);
        } else {
            console.log('Tabla users creada o ya existe');
        }
    });
    
    db.query(createGamesTable, (err) => {
        if (err) {
            console.error('Error creando tabla games:', err);
        } else {
            console.log('Tabla games creada o ya existe');
        }
    });
    
    db.query(createParticipantsTable, (err) => {
        if (err) {
            console.error('Error creando tabla participants:', err);
            console.log('Intentando crear tabla participants sin CHECK constraint...');
            // Intentar sin CHECK constraint para mayor compatibilidad
            const createParticipantsTableSimple = `
                CREATE TABLE IF NOT EXISTS participants (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    game_id INT,
                    assigned_to INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
                    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_game (user_id, game_id)
                ) ENGINE=InnoDB
            `;
            db.query(createParticipantsTableSimple, (err2) => {
                if (err2) {
                    console.error('Error creando tabla participants simple:', err2);
                } else {
                    console.log('Tabla participants creada sin CHECK constraint');
                }
            });
        } else {
            console.log('Tabla participants creada o ya existe');
        }
    });
    
    // Crear usuario administrador por defecto (con delay para asegurar que la tabla existe)
    setTimeout(() => {
        createDefaultAdmin();
    }, 1000);
}

// Crear administrador por defecto
function createDefaultAdmin() {
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    
    db.query('SELECT * FROM users WHERE username = ?', [adminUsername], (err, results) => {
        if (err) {
            console.error('Error verificando admin:', err);
            return;
        }
        
        if (results.length === 0) {
            const hashedPassword = bcrypt.hashSync(adminPassword, 10);
            db.query('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)', 
                [adminUsername, hashedPassword, true], (err) => {
                if (err) {
                    console.error('Error creando admin:', err);
                } else {
                    console.log('Usuario administrador creado: admin/admin123');
                }
            });
        }
    });
}

// Middleware para verificar autenticación
function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Middleware para verificar si es administrador
function requireAdmin(req, res, next) {
    if (req.session.user && req.session.user.is_admin) {
        next();
    } else {
        res.status(403).send('Acceso denegado. Se requieren permisos de administrador.');
    }
}

// Rutas principales

// Página de inicio
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Página de login
app.get('/login', (req, res) => {
    const success = req.query.success || null;
    res.render('login', { error: null, success: success });
});

// Procesar login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error en login:', err);
            return res.render('login', { error: 'Error del servidor', success: null });
        }
        
        if (results.length === 0) {
            return res.render('login', { error: 'Usuario no encontrado', success: null });
        }
        
        const user = results[0];
        
        if (bcrypt.compareSync(password, user.password)) {
            req.session.user = {
                id: user.id,
                username: user.username,
                is_admin: user.is_admin
            };
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'Contraseña incorrecta', success: null });
        }
    });
});

// Página de registro
app.get('/register', (req, res) => {
    res.render('register', { error: null, success: null });
});

// Procesar registro
app.post('/register', (req, res) => {
    const { username, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
        return res.render('register', { error: 'Las contraseñas no coinciden', success: null });
    }
    
    if (password.length < 6) {
        return res.render('register', { error: 'La contraseña debe tener al menos 6 caracteres', success: null });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.render('register', { error: 'El nombre de usuario ya existe', success: null });
            }
            console.error('Error en registro:', err);
            return res.render('register', { error: 'Error del servidor', success: null });
        }
        
        // Redirigir al login después del registro exitoso
        res.redirect('/login?success=Usuario registrado exitosamente. Puedes iniciar sesión.');
    });
});

// Dashboard principal
app.get('/dashboard', requireAuth, (req, res) => {
    // Obtener juegos activos
    db.query('SELECT * FROM games WHERE is_active = TRUE ORDER BY created_at DESC', (err, games) => {
        if (err) {
            console.error('Error obteniendo juegos:', err);
            return res.render('dashboard', { user: req.session.user, games: [], myAssignment: null, allUsers: [] });
        }
        
        // Obtener todos los usuarios (excepto administradores) para la ruleta
        db.query('SELECT username FROM users WHERE is_admin = FALSE ORDER BY username', (err, users) => {
            if (err) {
                console.error('Error obteniendo usuarios:', err);
                users = [];
            }
            
            const allUsers = users.map(user => user.username);
            
            // Si hay juegos activos, obtener la asignación del usuario
            if (games.length > 0) {
                const gameId = games[0].id;
                const userId = req.session.user.id;
                
                db.query(`
                    SELECT p.*, u.username as assigned_username 
                    FROM participants p 
                    JOIN users u ON p.assigned_to = u.id 
                    WHERE p.user_id = ? AND p.game_id = ?
                `, [userId, gameId], (err, assignment) => {
                    if (err) {
                        console.error('Error obteniendo asignación:', err);
                    }
                    
                    res.render('dashboard', { 
                        user: req.session.user, 
                        games: games, 
                        myAssignment: assignment.length > 0 ? assignment[0] : null,
                        allUsers: allUsers
                    });
                });
            } else {
                res.render('dashboard', { 
                    user: req.session.user, 
                    games: games, 
                    myAssignment: null,
                    allUsers: allUsers
                });
            }
        });
    });
});

// Panel de administración
app.get('/admin', requireAdmin, (req, res) => {
    // Obtener todos los juegos y usuarios
    db.query('SELECT * FROM games ORDER BY created_at DESC', (err, games) => {
        if (err) {
            console.error('Error obteniendo juegos:', err);
            return res.render('admin', { user: req.session.user, games: [], users: [] });
        }
        
        db.query('SELECT id, username, is_admin FROM users ORDER BY username', (err, users) => {
            if (err) {
                console.error('Error obteniendo usuarios:', err);
                return res.render('admin', { user: req.session.user, games: games, users: [] });
            }
            
            res.render('admin', { user: req.session.user, games: games, users: users });
        });
    });
});

// Crear nuevo juego
app.post('/admin/create-game', requireAdmin, (req, res) => {
    const { gameName } = req.body;
    
    db.query('INSERT INTO games (name, created_by) VALUES (?, ?)', 
        [gameName, req.session.user.id], (err, result) => {
        if (err) {
            console.error('Error creando juego:', err);
            return res.redirect('/admin?error=Error creando juego');
        }
        
        res.redirect('/admin?success=Juego creado exitosamente');
    });
});

// Activar juego y generar asignaciones (solo la primera vez)
app.post('/admin/activate-game/:id', requireAdmin, (req, res) => {
    const gameId = req.params.id;
    
    // Verificar si ya existen asignaciones para este juego
    db.query('SELECT COUNT(*) as count FROM participants WHERE game_id = ?', [gameId], (err, countResult) => {
        if (err) {
            console.error('Error verificando asignaciones:', err);
            return res.redirect('/admin?error=Error activando juego');
        }
        
        const hasExistingAssignments = countResult[0].count > 0;
        
        // Primero, desactivar todos los juegos
        db.query('UPDATE games SET is_active = FALSE', (err) => {
            if (err) {
                console.error('Error desactivando juegos:', err);
                return res.redirect('/admin?error=Error activando juego');
            }
            
            // Activar el juego seleccionado
            db.query('UPDATE games SET is_active = TRUE WHERE id = ?', [gameId], (err) => {
                if (err) {
                    console.error('Error activando juego:', err);
                    return res.redirect('/admin?error=Error activando juego');
                }
                
                if (hasExistingAssignments) {
                    // Si ya hay asignaciones, solo activar el juego sin generar nuevas asignaciones
                    console.log('El juego ya tiene asignaciones existentes, manteniéndolas...');
                    res.redirect('/admin?success=Juego activado - Se mantuvieron las asignaciones existentes');
                } else {
                    // Generar asignaciones aleatorias solo si no existen
                    generateAssignments(gameId, (success) => {
                        if (success) {
                            res.redirect('/admin?success=Juego activado y asignaciones generadas por primera vez');
                        } else {
                            res.redirect('/admin?error=Error generando asignaciones');
                        }
                    });
                }
            });
        });
    });
});

// Función para generar asignaciones aleatorias (solo primera vez)
function generateAssignments(gameId, callback) {
    // Obtener todos los usuarios (excepto administradores)
    db.query('SELECT id FROM users WHERE is_admin = FALSE', (err, users) => {
        if (err) {
            console.error('Error obteniendo usuarios:', err);
            return callback(false);
        }
        
        if (users.length < 2) {
            console.error('Se necesitan al menos 2 usuarios para jugar');
            return callback(false);
        }
        
        // Crear array de usuarios
        const userIds = users.map(user => user.id);
        let validAssignments = null;
        let attempts = 0;
        const maxAttempts = 100;
            
        
        // Intentar generar asignaciones válidas (nadie se asigna a sí mismo)
        while (!validAssignments && attempts < maxAttempts) {
            attempts++;
            const shuffledUsers = [...userIds];
            
            // Algoritmo de Fisher-Yates para mezclar
            for (let i = shuffledUsers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledUsers[i], shuffledUsers[j]] = [shuffledUsers[j], shuffledUsers[i]];
            }
            
            // Verificar que nadie se asigne a sí mismo
            let isValid = true;
            for (let i = 0; i < userIds.length; i++) {
                if (userIds[i] === shuffledUsers[i]) {
                    isValid = false;
                    break;
                }
            }
            
            // Si es válida, crear las asignaciones
            if (isValid) {
                const assignments = [];
                for (let i = 0; i < userIds.length; i++) {
                    const giver = userIds[i];
                    const receiver = shuffledUsers[i];
                    assignments.push([giver, gameId, receiver]);
                }
                validAssignments = assignments;
            }
        }
        
        // Si no se pudieron generar asignaciones válidas después de muchos intentos
        if (!validAssignments) {
            console.error('No se pudieron generar asignaciones válidas después de', maxAttempts, 'intentos');
            return callback(false);
        }
        
        // Insertar asignaciones en la base de datos
        const insertQuery = 'INSERT INTO participants (user_id, game_id, assigned_to) VALUES ?';
        db.query(insertQuery, [validAssignments], (err) => {
            if (err) {
                console.error('Error insertando asignaciones:', err);
                return callback(false);
            }
            
            console.log('Asignaciones generadas exitosamente después de', attempts, 'intentos');
            callback(true);
        });
    });
}// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;