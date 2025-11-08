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

if ($method === 'GET') {
    $filter = $_GET['filter'] ?? 'all';
    $date = $_GET['date'] ?? date('Y-m-d');
    
    try {
        $query = "
            SELECT 
                oh.id,
                oh.original_order_id,
                oh.tracking_number,
                oh.customer_name,
                oh.total_amount,
                oh.status,
                oh.order_date as created_at,
                oh.completed_at,
                DATE(oh.order_date) as order_date,
                GROUP_CONCAT(
                    CONCAT(ohi.food_name, ' x ', ohi.quantity, ' - ₱', ohi.price * ohi.quantity) 
                    SEPARATOR ', '
                ) as items
            FROM order_history oh
            LEFT JOIN order_history_items ohi ON oh.id = ohi.order_history_id
            WHERE 1=1
        ";
        
        $params = [];
        
        if ($filter === 'day') {
            $query .= " AND DATE(oh.order_date) = ?";
            $params[] = $date;
        } elseif ($filter === 'month') {
            $query .= " AND YEAR(oh.order_date) = YEAR(?) AND MONTH(oh.order_date) = MONTH(?)";
            $params[] = $date;
            $params[] = $date;
        }
        
        $query .= " GROUP BY oh.id ORDER BY oh.order_date DESC, oh.completed_at DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();
        
        $totalSales = 0;
        $totalOrders = count($orders);
        $completedOrders = $totalOrders;
        $completedSales = 0;
        
        foreach ($orders as $order) {
            $totalSales += floatval($order['total_amount']);
            $completedSales += floatval($order['total_amount']);
        }
        
        $dailyBreakdown = [];
        if ($filter === 'month') {
            $dailyQuery = "
                SELECT 
                    DATE(oh.order_date) as order_date,
                    COUNT(DISTINCT oh.id) as order_count,
                    SUM(oh.total_amount) as daily_total
                FROM order_history oh
                WHERE YEAR(oh.order_date) = YEAR(?) AND MONTH(oh.order_date) = MONTH(?)
                GROUP BY DATE(oh.order_date)
                ORDER BY order_date DESC
            ";
            $dailyStmt = $pdo->prepare($dailyQuery);
            $dailyStmt->execute([$date, $date]);
            $dailyBreakdown = $dailyStmt->fetchAll();
        }
        
        echo json_encode([
            'success' => true,
            'orders' => $orders,
            'summary' => [
                'total_sales' => number_format($totalSales, 2, '.', ''),
                'total_orders' => $totalOrders,
                'completed_orders' => $completedOrders,
                'completed_sales' => number_format($completedSales, 2, '.', ''),
                'pending_sales' => '0.00'
            ],
            'daily_breakdown' => $dailyBreakdown,
            'filter' => $filter,
            'date' => $date
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch order history: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>