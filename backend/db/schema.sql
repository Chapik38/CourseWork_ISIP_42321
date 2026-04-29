CREATE DATABASE IF NOT EXISTS pc_configurator_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pc_configurator_pro;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','moderator','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  INDEX idx_users_role (role),
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS components (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('cpu','motherboard','gpu','ram','storage','case','psu','cooler','sound','extra','peripheral','software') NOT NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  specs JSON NOT NULL,
  socket VARCHAR(50) NULL,
  tdp INT UNSIGNED NOT NULL DEFAULT 0,
  compatibility JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_components_type_price (type, price),
  INDEX idx_components_brand (brand)
) ENGINE=InnoDB;

ALTER TABLE components MODIFY type ENUM('cpu','motherboard','gpu','ram','storage','case','psu','cooler','sound','extra','peripheral','software') NOT NULL;

CREATE TABLE IF NOT EXISTS configurations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  goal ENUM('gaming','work','design','server') NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  components JSON NOT NULL,
  bottleneck_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_config_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_config_user (user_id),
  INDEX idx_config_goal (goal)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  configuration_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_config FOREIGN KEY (configuration_id) REFERENCES configurations(id) ON DELETE CASCADE,
  INDEX idx_orders_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(128) NOT NULL PRIMARY KEY,
  session JSON NOT NULL,
  expires BIGINT UNSIGNED NOT NULL,
  INDEX idx_sessions_expires (expires)
) ENGINE=InnoDB;

ALTER TABLE sessions MODIFY expires BIGINT UNSIGNED NOT NULL;

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(255) NOT NULL,
  ip VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_logs_user_time (user_id, created_at),
  INDEX idx_logs_action (action)
) ENGINE=InnoDB;
