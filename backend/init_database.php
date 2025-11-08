<?php
$host = 'localhost';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $pdo->exec("CREATE DATABASE IF NOT EXISTS ordering_system");
    $pdo->exec("USE ordering_system");
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS foods (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            image LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tracking_number VARCHAR(50) UNIQUE NOT NULL,
            customer_name VARCHAR(255),
            total_amount DECIMAL(10,2) NOT NULL,
            status ENUM('pending', 'ready', 'completed') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            food_id INT NOT NULL,
            quantity INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        )
    ");
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS order_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            original_order_id INT NOT NULL,
            tracking_number VARCHAR(50) NOT NULL,
            customer_name VARCHAR(255) DEFAULT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'completed',
            order_date TIMESTAMP NOT NULL,
            completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY original_order_id (original_order_id),
            KEY order_date (order_date),
            KEY completed_at (completed_at)
        )
    ");
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS order_history_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_history_id INT NOT NULL,
            food_id INT NOT NULL,
            food_name VARCHAR(255) NOT NULL,
            quantity INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            KEY order_history_id (order_history_id),
            KEY food_id (food_id),
            FOREIGN KEY (order_history_id) REFERENCES order_history(id) ON DELETE CASCADE,
            FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        )
    ");
    
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM admin WHERE username = 'admin'");
    $stmt->execute();
    $count = $stmt->fetchColumn();
    
    if ($count == 0) {
        $hashedPassword = password_hash('1234', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO admin (username, password) VALUES (?, ?)");
        $stmt->execute(['admin', $hashedPassword]);
    }
    
    echo "Database initialized successfully!";
    
} catch(PDOException $e) {
    die("Error: " . $e->getMessage());
}
?>