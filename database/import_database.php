<?php

$host = 'localhost';
$username = 'root';
$password = '';

echo "Food Ordering System - Database Import\n";
echo "=====================================\n\n";

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Connected to MySQL server\n";
    
    $sqlFile = __DIR__ . '/ordering_system.sql';
    
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    
    $sql = preg_replace('/^--.*$/m', '', $sql);
    $sql = preg_replace('/^\/\*.*?\*\/$/ms', '', $sql);
    
    try {
        $pdo->exec("CREATE DATABASE IF NOT EXISTS ordering_system CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
        echo "✓ Database created/verified\n";
    } catch (PDOException $e) {
        echo "⚠ Database already exists or error: " . $e->getMessage() . "\n";
    }
    
    $pdo = new PDO("mysql:host=$host;dbname=ordering_system;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = preg_replace('/^SET\s+[^;]+;/mi', '', $sql);
    $sql = preg_replace('/^START\s+TRANSACTION;/mi', '', $sql);
    $sql = preg_replace('/^COMMIT;/mi', '', $sql);
    
    $statements = [];
    $currentStatement = '';
    $inString = false;
    $quoteChar = '';
    
    for ($i = 0; $i < strlen($sql); $i++) {
        $char = $sql[$i];
        $nextChar = ($i + 1 < strlen($sql)) ? $sql[$i + 1] : '';
        
        if (!$inString && ($char === '"' || $char === "'" || $char === '`')) {
            $inString = true;
            $quoteChar = $char;
        } elseif ($inString && $char === $quoteChar && $nextChar !== $quoteChar) {
            $inString = false;
            $quoteChar = '';
        } elseif (!$inString && $char === ';') {
            $statement = trim($currentStatement);
            if (!empty($statement) && strlen($statement) > 5) {
                $statements[] = $statement;
            }
            $currentStatement = '';
            continue;
        }
        
        $currentStatement .= $char;
    }
    
    $statement = trim($currentStatement);
    if (!empty($statement) && strlen($statement) > 5) {
        $statements[] = $statement;
    }
    
    echo "✓ Parsed " . count($statements) . " SQL statements\n";
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $index => $statement) {
        if (empty($statement) || trim($statement) === '') {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            $successCount++;
        } catch (PDOException $e) {
            $errorMsg = $e->getMessage();
            if (strpos($errorMsg, 'already exists') === false && 
                strpos($errorMsg, 'Duplicate') === false &&
                strpos($errorMsg, 'Unknown database') === false) {
                echo "⚠ Warning (statement " . ($index + 1) . "): " . substr($errorMsg, 0, 100) . "...\n";
                $errorCount++;
            } else {
                $successCount++;
            }
        }
    }
    
    echo "\n✓ Database import completed!\n";
    echo "  - Successful statements: $successCount\n";
    echo "  - Warnings/Errors: $errorCount\n\n";
    
    $pdo = new PDO("mysql:host=$host;dbname=ordering_system;charset=utf8mb4", $username, $password);
    
    $tables = ['foods', 'orders', 'order_items', 'admin'];
    
    echo "Database Contents:\n";
    echo "==================\n";
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
        $count = $stmt->fetchColumn();
        echo "  $table: $count records\n";
    }
    
    echo "\n🎉 Setup Complete!\n";
    echo "==================\n";
    echo "You can now access your system at:\n";
    echo "http://localhost/Ordering_System/\n\n";
    echo "Default Admin Login:\n";
    echo "Username: admin\n";
    echo "Password: 1234\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\nTroubleshooting:\n";
    echo "1. Make sure XAMPP is running\n";
    echo "2. Check that MySQL service is started\n";
    echo "3. Verify database credentials\n";
    exit(1);
}
?>