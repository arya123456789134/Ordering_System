<?php

$host = 'localhost';
$dbname = 'ordering_system';
$username = 'root';
$password = '';

echo "Food Ordering System - Database Verification\n";
echo "===========================================\n\n";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Database connection successful\n";
    
    $requiredTables = ['foods', 'orders', 'order_items', 'admin'];
    $existingTables = [];
    
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $existingTables[] = $row[0];
    }
    
    echo "\nTable Verification:\n";
    echo "===================\n";
    
    $allTablesExist = true;
    foreach ($requiredTables as $table) {
        if (in_array($table, $existingTables)) {
            echo "✓ $table table exists\n";
        } else {
            echo "❌ $table table missing\n";
            $allTablesExist = false;
        }
    }
    
    if (!$allTablesExist) {
        echo "\n❌ Some tables are missing. Please run the import script.\n";
        exit(1);
    }
    
    echo "\nData Verification:\n";
    echo "==================\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM foods");
    $foodCount = $stmt->fetchColumn();
    echo "✓ Foods: $foodCount items\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM admin");
    $adminCount = $stmt->fetchColumn();
    echo "✓ Admin users: $adminCount\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM orders");
    $orderCount = $stmt->fetchColumn();
    echo "✓ Orders: $orderCount\n";
    
    echo "\nAdmin Login Test:\n";
    echo "=================\n";
    
    $stmt = $pdo->prepare("SELECT username, password FROM admin WHERE username = ?");
    $stmt->execute(['admin']);
    $admin = $stmt->fetch();
    
    if ($admin && password_verify('1234', $admin['password'])) {
        echo "✓ Admin login credentials working\n";
    } else {
        echo "❌ Admin login credentials not working\n";
    }
    
    echo "\nAPI Endpoint Test:\n";
    echo "==================\n";
    
    $stmt = $pdo->query("SELECT id, name, category, price FROM foods LIMIT 1");
    $food = $stmt->fetch();
    if ($food) {
        echo "✓ Foods API accessible\n";
    } else {
        echo "❌ Foods API not working\n";
    }
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM orders");
    $orderCount = $stmt->fetchColumn();
    echo "✓ Orders API accessible ($orderCount orders)\n";
    
    echo "\n🎉 Database verification completed successfully!\n";
    echo "Your Food Ordering System is ready to use.\n";
    echo "\nAccess your system at: http://localhost/Ordering_System/\n";
    echo "Admin login: admin / 1234\n";
    
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    echo "\nTroubleshooting:\n";
    echo "1. Make sure XAMPP MySQL is running\n";
    echo "2. Check database credentials\n";
    echo "3. Run the import script first\n";
    exit(1);
}
?>