<?php

$host = 'localhost';
$username = 'root';
$password = '';

echo "Adding Toppings Support to Database\n";
echo "===================================\n\n";

try {
    $pdo = new PDO("mysql:host=$host;dbname=ordering_system;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Connected to database\n";
    
    $checkToppings = $pdo->query("SHOW COLUMNS FROM foods LIKE 'toppings'");
    if ($checkToppings->rowCount() == 0) {
        $pdo->exec("ALTER TABLE foods ADD COLUMN toppings TEXT NULL AFTER sizes");
        echo "✓ Added 'toppings' column to foods table\n";
    } else {
        echo "⚠ 'toppings' column already exists in foods table\n";
    }
    
    $checkOrderToppings = $pdo->query("SHOW COLUMNS FROM order_items LIKE 'toppings'");
    if ($checkOrderToppings->rowCount() == 0) {
        $pdo->exec("ALTER TABLE order_items ADD COLUMN toppings TEXT NULL AFTER size");
        echo "✓ Added 'toppings' column to order_items table\n";
    } else {
        echo "⚠ 'toppings' column already exists in order_items table\n";
    }
    
    echo "\n✓ Migration completed successfully!\n";
    echo "\nYou can now add toppings to food items in the admin panel.\n";
    
} catch (PDOException $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>