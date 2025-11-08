<?php
$host = 'localhost';
$username = 'root';
$password = '';
$dbname = 'ordering_system';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
    
    echo "✓ order_history table created successfully\n";
    
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");
    
    echo "✓ order_history_items table created successfully\n";
    echo "\nMigration completed successfully! The order_history tables are now available.\n";
    
} catch(PDOException $e) {
    die("Error: " . $e->getMessage() . "\n");
}
?>

