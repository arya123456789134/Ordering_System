<?php

$host = 'localhost';
$username = 'root';
$password = '';

echo "Adding Size Support to Database\n";
echo "================================\n\n";

try {
    $pdo = new PDO("mysql:host=$host;dbname=ordering_system;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Connected to database\n";
    
    $checkSizes = $pdo->query("SHOW COLUMNS FROM foods LIKE 'sizes'");
    if ($checkSizes->rowCount() == 0) {
        $pdo->exec("ALTER TABLE foods ADD COLUMN sizes TEXT NULL AFTER price");
        echo "✓ Added 'sizes' column to foods table\n";
    } else {
        echo "⚠ 'sizes' column already exists in foods table\n";
    }
    
    $checkSize = $pdo->query("SHOW COLUMNS FROM order_items LIKE 'size'");
    if ($checkSize->rowCount() == 0) {
        $pdo->exec("ALTER TABLE order_items ADD COLUMN size VARCHAR(50) NULL AFTER price");
        echo "✓ Added 'size' column to order_items table\n";
    } else {
        echo "⚠ 'size' column already exists in order_items table\n";
    }
    
    echo "\n✓ Migration completed successfully!\n";
    echo "\nYou can now use size options (small/large) when adding food items in the admin panel.\n";
    
} catch (PDOException $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>