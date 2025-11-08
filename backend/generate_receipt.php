<?php
error_reporting(0);
ini_set('display_errors', 0);

$use_tcpdf = class_exists('TCPDF');

if (!$use_tcpdf) {
    $tcpdf_paths = [
        __DIR__ . '/../vendor/tecnickcom/tcpdf/tcpdf.php',
        __DIR__ . '/tcpdf/tcpdf.php',
        'C:/xampp/php/pear/tcpdf/tcpdf.php'
    ];
    
    foreach ($tcpdf_paths as $path) {
        if (file_exists($path)) {
            require_once $path;
            $use_tcpdf = true;
            break;
        }
    }
}

try {
    require_once 'config.php';
} catch (Exception $e) {
    http_response_code(500);
    die('Database connection failed');
}

$orderId = $_GET['order_id'] ?? null;
$fromHistory = isset($_GET['from_history']) ? true : false;

if (!$orderId) {
    http_response_code(400);
    die('Order ID is required');
}

try {
    $stmt = $pdo->prepare("
        SELECT o.*, 
               GROUP_CONCAT(
                   CONCAT(f.name, ' x ', oi.quantity, ' - ₱', oi.price * oi.quantity) 
                   SEPARATOR ', '
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN foods f ON oi.food_id = f.id
        WHERE o.id = ?
        GROUP BY o.id
    ");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    
    $orderItems = [];
    
    if (!$order) {
        $historyId = $_GET['from_history'] ?? $orderId;
        $stmt = $pdo->prepare("
            SELECT oh.*, 
                   oh.order_date as created_at,
                   GROUP_CONCAT(
                       CONCAT(ohi.food_name, ' x ', ohi.quantity, ' - ₱', ohi.price * ohi.quantity) 
                       SEPARATOR ', '
                   ) as items
            FROM order_history oh
            LEFT JOIN order_history_items ohi ON oh.id = ohi.order_history_id
            WHERE oh.id = ? OR oh.original_order_id = ?
            GROUP BY oh.id
        ");
        $stmt->execute([$historyId, $orderId]);
        $order = $stmt->fetch();
        
        if ($order) {
            $itemsStmt = $pdo->prepare("
                SELECT ohi.*, ohi.food_name, ohi.quantity, ohi.price
                FROM order_history_items ohi
                WHERE ohi.order_history_id = ?
            ");
            $itemsStmt->execute([$order['id']]);
            $orderItems = $itemsStmt->fetchAll();
        }
    } else {
        $itemsStmt = $pdo->prepare("
            SELECT oi.*, f.name as food_name
            FROM order_items oi
            JOIN foods f ON oi.food_id = f.id
            WHERE oi.order_id = ?
        ");
        $itemsStmt->execute([$orderId]);
        $orderItems = $itemsStmt->fetchAll();
    }
    
    if (!$order) {
        http_response_code(404);
        die('Order not found');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    die('Failed to fetch order details: ' . $e->getMessage());
}

if ($use_tcpdf && class_exists('TCPDF')) {
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    
    $pdf->SetCreator('Ordering System');
    $pdf->SetAuthor('Ordering System');
    $pdf->SetTitle('Receipt - ' . $order['tracking_number']);
    $pdf->SetSubject('Order Receipt');
    
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    
    $pdf->AddPage();
    
    $pdf->SetFont('helvetica', 'B', 20);
    $pdf->Cell(0, 10, 'ORDER RECEIPT', 0, 1, 'C');
    
    $pdf->Ln(5);
    
    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 8, 'Tracking Number: ' . $order['tracking_number'], 0, 1);
    $pdf->Cell(0, 8, 'Customer Name: ' . ($order['customer_name'] ?: 'Anonymous'), 0, 1);
    $pdf->Cell(0, 8, 'Order Date: ' . date('F d, Y h:i A', strtotime($order['created_at'])), 0, 1);
    $pdf->Cell(0, 8, 'Status: ' . strtoupper($order['status']), 0, 1);
    
    $pdf->Ln(5);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(100, 8, 'Item', 1, 0, 'L');
    $pdf->Cell(30, 8, 'Quantity', 1, 0, 'C');
    $pdf->Cell(30, 8, 'Price', 1, 0, 'R');
    $pdf->Cell(30, 8, 'Total', 1, 1, 'R');
    
    $pdf->SetFont('helvetica', '', 10);
    foreach ($orderItems as $item) {
        $itemTotal = $item['quantity'] * $item['price'];
        $pdf->Cell(100, 8, $item['food_name'], 1, 0, 'L');
        $pdf->Cell(30, 8, $item['quantity'], 1, 0, 'C');
        $pdf->Cell(30, 8, '₱' . number_format($item['price'], 2), 1, 0, 'R');
        $pdf->Cell(30, 8, '₱' . number_format($itemTotal, 2), 1, 1, 'R');
    }
    
    $pdf->Ln(5);
    
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(130, 10, 'TOTAL AMOUNT:', 0, 0, 'R');
    $pdf->Cell(60, 10, '₱' . number_format($order['total_amount'], 2), 0, 1, 'R');
    
    $pdf->Ln(10);
    
    $pdf->SetFont('helvetica', 'I', 10);
    $pdf->Cell(0, 8, 'Thank you for your order!', 0, 1, 'C');
    
    $pdf->Output('Receipt_' . $order['tracking_number'] . '.pdf', 'D');
    
} else {
    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - <?php echo htmlspecialchars($order['tracking_number']); ?></title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
                background:
            }
            .receipt-container {
                background: white;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .receipt-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid
                padding-bottom: 20px;
            }
            .receipt-header h1 {
                font-size: 28px;
                color:
                margin-bottom: 10px;
            }
            .receipt-info {
                margin-bottom: 20px;
            }
            .receipt-info p {
                margin: 8px 0;
                font-size: 14px;
                color:
            }
            .receipt-info strong {
                color:
                width: 150px;
                display: inline-block;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .items-table th {
                background:
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: bold;
            }
            .items-table td {
                padding: 10px 12px;
                border-bottom: 1px solid
            }
            .items-table tr:last-child td {
                border-bottom: 2px solid
            }
            .text-right {
                text-align: right;
            }
            .text-center {
                text-align: center;
            }
            .total-section {
                margin-top: 20px;
                text-align: right;
            }
            .total-amount {
                font-size: 24px;
                font-weight: bold;
                color:
                margin-top: 10px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid
                color:
                font-style: italic;
            }
            @media print {
                body {
                    background: white;
                    padding: 0;
                }
                .receipt-container {
                    box-shadow: none;
                    padding: 20px;
                }
                .no-print {
                    display: none;
                }
            }
            .print-btn {
                background:
                color: white;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                border-radius: 5px;
                cursor: pointer;
                margin: 20px 0;
            }
            .print-btn:hover {
                background:
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="receipt-header">
                <h1>ORDER RECEIPT</h1>
            </div>
            
            <div class="receipt-info">
                <p><strong>Tracking Number:</strong> <?php echo htmlspecialchars($order['tracking_number']); ?></p>
                <p><strong>Customer Name:</strong> <?php echo htmlspecialchars($order['customer_name'] ?: 'Anonymous'); ?></p>
                <p><strong>Order Date:</strong> <?php echo date('F d, Y h:i A', strtotime($order['created_at'])); ?></p>
                <p><strong>Status:</strong> <?php echo strtoupper($order['status']); ?></p>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="text-center">Quantity</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($orderItems as $item): 
                        $itemTotal = $item['quantity'] * $item['price'];
                    ?>
                    <tr>
                        <td><?php echo htmlspecialchars($item['food_name']); ?></td>
                        <td class="text-center"><?php echo $item['quantity']; ?></td>
                        <td class="text-right">₱<?php echo number_format($item['price'], 2); ?></td>
                        <td class="text-right">₱<?php echo number_format($itemTotal, 2); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
            <div class="total-section">
                <p style="font-size: 18px; margin-bottom: 5px;"><strong>TOTAL AMOUNT:</strong></p>
                <p class="total-amount">₱<?php echo number_format($order['total_amount'], 2); ?></p>
            </div>
            
            <div class="footer">
                <p>Thank you for your order!</p>
            </div>
        </div>
        
        <div class="no-print" style="text-align: center;">
            <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        </div>
        
        <script>
            if (window.location.search.includes('autoprint=1')) {
                window.onload = function() {
                    window.print();
                };
            }
        </script>
    </body>
    </html>
    <?php
}
?>