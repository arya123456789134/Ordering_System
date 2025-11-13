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
        $stmt = $pdo->query("
            SELECT o.*
            FROM orders o
            ORDER BY o.created_at DESC
        ");
        $orders = $stmt->fetchAll();
        
        foreach ($orders as &$order) {
            $itemsStmt = $pdo->prepare("
                SELECT f.name, oi.size, oi.quantity, oi.price, oi.toppings
                FROM order_items oi
                LEFT JOIN foods f ON oi.food_id = f.id
                WHERE oi.order_id = ?
            ");
            $itemsStmt->execute([$order['id']]);
            $orderItems = $itemsStmt->fetchAll();
            
            $itemsList = [];
            foreach ($orderItems as $item) {
                $itemStr = $item['name'];
                
                if (!empty($item['size'])) {
                    $itemStr .= ' (' . ucfirst($item['size']) . ')';
                }
                
                if (!empty($item['toppings'])) {
                    $toppings = json_decode($item['toppings'], true);
                    if (is_array($toppings) && count($toppings) > 0) {
                        $toppingNames = [];
                        foreach ($toppings as $topping) {
                            if (is_array($topping) && isset($topping['name'])) {
                                $toppingNames[] = $topping['name'];
                            }
                        }
                        if (count($toppingNames) > 0) {
                            $itemStr .= ' +' . implode(', ', $toppingNames);
                        }
                    }
                }
                
                $itemStr .= ' x ' . $item['quantity'] . ' - ₱' . number_format($item['price'] * $item['quantity'], 2);
                $itemsList[] = $itemStr;
            }
            
            $order['items'] = implode(', ', $itemsList);
        }
        unset($order);
        
        echo json_encode($orders);
        break;
        
    case 'POST':
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
            exit;
        }
        
        if ($data === null) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request data']);
            exit;
        }
        
        $items = $data['items'] ?? [];
        $customerName = $data['customer_name'] ?? 'Anonymous';
        
        if (empty($items)) {
            http_response_code(400);
            echo json_encode(['error' => 'No items in order']);
            exit;
        }
        
        try {
            $pdo->beginTransaction();
            
            $trackingNumber = 'ORD' . date('Ymd') . rand(1000, 9999);
            
            $totalAmount = 0;
            foreach ($items as $item) {
                $totalAmount += $item['price'] * $item['quantity'];
            }
            
            $stmt = $pdo->prepare("INSERT INTO orders (tracking_number, customer_name, total_amount) VALUES (?, ?, ?)");
            $stmt->execute([$trackingNumber, $customerName, $totalAmount]);
            $orderId = $pdo->lastInsertId();
            
            try {
                $checkColumn = $pdo->query("SHOW COLUMNS FROM order_items LIKE 'size'");
                if ($checkColumn->rowCount() == 0) {
                    $pdo->exec("ALTER TABLE order_items ADD COLUMN size VARCHAR(50) NULL AFTER price");
                }
            } catch (Exception $e) {
            }
            
            try {
                $checkToppings = $pdo->query("SHOW COLUMNS FROM order_items LIKE 'toppings'");
                if ($checkToppings->rowCount() == 0) {
                    $pdo->exec("ALTER TABLE order_items ADD COLUMN toppings TEXT NULL AFTER size");
                }
            } catch (Exception $e) {
            }
            
            $stmt = $pdo->prepare("INSERT INTO order_items (order_id, food_id, quantity, price, size, toppings) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($items as $item) {
                if (!isset($item['food_id']) || $item['food_id'] === null) {
                    throw new Exception('Missing food_id in order item');
                }
                if (!isset($item['quantity']) || $item['quantity'] <= 0) {
                    throw new Exception('Invalid quantity in order item');
                }
                if (!isset($item['price']) || $item['price'] < 0) {
                    throw new Exception('Invalid price in order item');
                }
                
                $checkFood = $pdo->prepare("SELECT id FROM foods WHERE id = ?");
                $checkFood->execute([$item['food_id']]);
                if ($checkFood->rowCount() === 0) {
                    throw new Exception('Food item with id ' . $item['food_id'] . ' not found');
                }
                
                $size = $item['size'] ?? null;
                $toppings = $item['toppings'] ?? null;
                $stmt->execute([$orderId, $item['food_id'], $item['quantity'], $item['price'], $size, $toppings]);
            }
            
            $pdo->commit();
            echo json_encode(['success' => true, 'tracking_number' => $trackingNumber]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create order: ' . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $orderId = $data['order_id'] ?? null;
        $status = $data['status'] ?? null;
        
        if (!$orderId || !$status) {
            http_response_code(400);
            echo json_encode(['error' => 'Order ID and status required']);
            exit;
        }
        
        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
            $stmt->execute([$orderId]);
            $order = $stmt->fetch();
            
            if (!$order) {
                throw new Exception('Order not found');
            }
            
            $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->execute([$status, $orderId]);
            
            if ($status === 'completed') {
                $checkStmt = $pdo->prepare("SELECT id FROM order_history WHERE original_order_id = ?");
                $checkStmt->execute([$orderId]);
                $existingHistory = $checkStmt->fetch();
                
                if (!$existingHistory) {
                    $historyStmt = $pdo->prepare("
                        INSERT INTO order_history 
                        (original_order_id, tracking_number, customer_name, total_amount, status, order_date, completed_at)
                        VALUES (?, ?, ?, ?, ?, ?, NOW())
                    ");
                    $historyStmt->execute([
                        $order['id'],
                        $order['tracking_number'],
                        $order['customer_name'],
                        $order['total_amount'],
                        'completed',
                        $order['created_at']
                    ]);
                    $historyId = $pdo->lastInsertId();
                    
                    $itemsStmt = $pdo->prepare("
                        SELECT oi.*, f.name as food_name
                        FROM order_items oi
                        JOIN foods f ON oi.food_id = f.id
                        WHERE oi.order_id = ?
                    ");
                    $itemsStmt->execute([$orderId]);
                    $items = $itemsStmt->fetchAll();
                    
                    $itemHistoryStmt = $pdo->prepare("
                        INSERT INTO order_history_items 
                        (order_history_id, food_id, food_name, quantity, price)
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    
                    foreach ($items as $item) {
                        $itemHistoryStmt->execute([
                            $historyId,
                            $item['food_id'],
                            $item['food_name'],
                            $item['quantity'],
                            $item['price']
                        ]);
                    }
                }
            }
            
            $pdo->commit();
            echo json_encode(['success' => true]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update order: ' . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        $orderId = $data['order_id'] ?? null;
        $action = $data['action'] ?? 'delete';
        
        if (!$orderId) {
            http_response_code(400);
            echo json_encode(['error' => 'Order ID required']);
            exit;
        }
        
        try {
            if ($action === 'cancel') {
                $stmt = $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?");
                $stmt->execute([$orderId]);
                echo json_encode(['success' => true, 'message' => 'Order cancelled successfully']);
            } else {
                $pdo->beginTransaction();
                
                $stmt = $pdo->prepare("DELETE FROM order_items WHERE order_id = ?");
                $stmt->execute([$orderId]);
                
                $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
                $stmt->execute([$orderId]);
                
                $pdo->commit();
                echo json_encode(['success' => true, 'message' => 'Order deleted successfully']);
            }
        } catch (Exception $e) {
            if ($action !== 'cancel') {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['error' => 'Failed to ' . ($action === 'cancel' ? 'cancel' : 'delete') . ' order']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>