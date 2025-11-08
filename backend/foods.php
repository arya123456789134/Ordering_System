<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');

try {
    require_once 'config.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM foods ORDER BY category, name");
        $foods = $stmt->fetchAll();
        echo json_encode($foods);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $name = $data['name'] ?? '';
        $category = $data['category'] ?? '';
        $price = floatval($data['price'] ?? 0);
        $sizes = $data['sizes'] ?? null;
        $toppings = $data['toppings'] ?? null;
        $image = $data['image'] ?? '';
        
        if (empty($name) || empty($category)) {
            http_response_code(400);
            echo json_encode(['error' => 'Name and category are required']);
            exit;
        }
        
        if ($price <= 0) {
            http_response_code(400);
            $errorMessage = $price < 0 ? 'Price cannot be negative' : 'Price must be a positive number';
            echo json_encode(['error' => $errorMessage]);
            exit;
        }
        
        try {
            $checkColumn = $pdo->query("SHOW COLUMNS FROM foods LIKE 'sizes'");
            if ($checkColumn->rowCount() == 0) {
                $pdo->exec("ALTER TABLE foods ADD COLUMN sizes TEXT NULL AFTER price");
            }
        } catch (Exception $e) {
        }
        
        try {
            $checkToppings = $pdo->query("SHOW COLUMNS FROM foods LIKE 'toppings'");
            if ($checkToppings->rowCount() == 0) {
                $pdo->exec("ALTER TABLE foods ADD COLUMN toppings TEXT NULL AFTER sizes");
            }
        } catch (Exception $e) {
        }
        
        $stmt = $pdo->prepare("INSERT INTO foods (name, category, price, sizes, toppings, image) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $category, $price, $sizes, $toppings, $image]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;
        
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Food ID required']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM foods WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>