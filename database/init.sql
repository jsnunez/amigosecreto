-- Base de datos para Amigo Secreto
-- Ejecutar estos comandos en MySQL para crear la base de datos

CREATE DATABASE IF NOT EXISTS amigo_secreto;
USE amigo_secreto;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de juegos
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabla de participantes
CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    game_id INT,
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    UNIQUE KEY unique_user_game (user_id, game_id),
    CHECK (user_id != assigned_to)
);

-- Tabla de mensajes de chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_game_receiver (game_id, receiver_id),
    INDEX idx_game_sender (game_id, sender_id),
    INDEX idx_created_at (created_at)
);

-- Insertar usuario administrador por defecto
-- Contraseña: admin123 (hasheada con bcrypt)
INSERT INTO users (username, password, is_admin) VALUES 
('admin', '$2a$10$8K9wBpz8QYtOvOgMnE1YGeF9zG6oWaE2SJ7GvYxF9mPqH4L6K5J8.', TRUE)
ON DUPLICATE KEY UPDATE username = username;

-- Datos de ejemplo (opcional)
-- Descomenta las siguientes líneas para insertar usuarios de prueba

-- INSERT IGNORE INTO users (username, password, is_admin) VALUES 
-- ('juan', '$2a$10$8K9wBpz8QYtOvOgMnE1YGeF9zG6oWaE2SJ7GvYxF9mPqH4L6K5J8.', FALSE),
-- ('maria', '$2a$10$8K9wBpz8QYtOvOgMnE1YGeF9zG6oWaE2SJ7GvYxF9mPqH4L6K5J8.', FALSE),
-- ('carlos', '$2a$10$8K9wBpz8QYtOvOgMnE1YGeF9zG6oWaE2SJ7GvYxF9mPqH4L6K5J8.', FALSE),
-- ('ana', '$2a$10$8K9wBpz8QYtOvOgMnE1YGeF9zG6oWaE2SJ7GvYxF9mPqH4L6K5J8.', FALSE);

-- Ver estructura de las tablas
SHOW TABLES;
DESCRIBE users;
DESCRIBE games;
DESCRIBE participants;