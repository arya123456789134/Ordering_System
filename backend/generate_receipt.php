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
            SELECT oi.*, f.name as food_name, oi.size, oi.toppings
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
    $pdf->Cell(90, 10, 'Item', 1, 0, 'L');
    $pdf->Cell(25, 10, 'Qty', 1, 0, 'C');
    $pdf->Cell(35, 10, 'Price', 1, 0, 'R');
    $pdf->Cell(40, 10, 'Total', 1, 1, 'R');
    
    $pdf->SetFont('helvetica', '', 10);
    foreach ($orderItems as $item) {
        $itemTotal = $item['quantity'] * $item['price'];
        
        // Build item name with size and toppings for PDF
        $itemName = $item['food_name'];
        
        // Add size if available
        if (!empty($item['size'])) {
            $itemName .= ' (' . ucfirst($item['size']) . ')';
        }
        
        // Add toppings if available
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
                    $itemName .= ' +' . implode(', ', $toppingNames);
                }
            }
        }
        
        $pdf->Cell(90, 10, $itemName, 1, 0, 'L');
        $pdf->Cell(25, 10, $item['quantity'], 1, 0, 'C');
        $pdf->Cell(35, 10, '₱' . number_format($item['price'], 2), 1, 0, 'R');
        $pdf->Cell(40, 10, '₱' . number_format($itemTotal, 2), 1, 1, 'R');
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
                background: #f5f5f5;
            }
            .receipt-container {
                background: white;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                border-radius: 8px;
            }
            .receipt-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            .receipt-header h1 {
                font-size: 28px;
                color: #333;
                margin-bottom: 10px;
            }
            .receipt-info {
                margin-bottom: 20px;
            }
            .receipt-info p {
                margin: 8px 0;
                font-size: 14px;
                color: #555;
            }
            .receipt-info strong {
                color: #333;
                width: 150px;
                display: inline-block;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                border: 1px solid #ddd;
                table-layout: fixed;
            }
            .items-table th {
                background: #333;
                color: white;
                padding: 15px 12px;
                text-align: left;
                font-weight: bold;
                border: 1px solid #333;
                font-size: 14px;
            }
            .items-table th:nth-child(1) {
                width: 45%;
                text-align: left;
            }
            .items-table th:nth-child(2) {
                width: 12%;
                text-align: center;
            }
            .items-table th:nth-child(3) {
                width: 21.5%;
                text-align: right;
            }
            .items-table th:nth-child(4) {
                width: 21.5%;
                text-align: right;
            }
            .items-table td {
                padding: 15px 12px;
                border: 1px solid #ddd;
                vertical-align: middle;
                word-wrap: break-word;
                line-height: 1.4;
            }
            .items-table td:nth-child(1) {
                text-align: left;
                vertical-align: top;
            }
            .items-table td:nth-child(2) {
                text-align: center;
                vertical-align: middle;
                font-weight: 600;
            }
            .items-table td:nth-child(3) {
                text-align: right;
                vertical-align: middle;
                font-weight: 600;
            }
            .items-table td:nth-child(4) {
                text-align: right;
                vertical-align: middle;
                font-weight: 700;
                color: #333;
            }
            .items-table tbody tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            .items-table tbody tr:nth-child(odd) {
                background-color: #ffffff;
            }
            .items-table tbody tr:last-child td {
                border-bottom: 2px solid #333;
                font-weight: 600;
            }
            .items-table tbody tr:hover {
                background-color: #e3f2fd;
            }
            .items-table td small {
                display: block;
                margin-top: 4px;
                line-height: 1.3;
                color: #666;
                font-style: italic;
            }
            .table-wrapper {
                overflow-x: visible;
                width: 100%;
            }
            .text-right {
                text-align: right !important;
            }
            .text-center {
                text-align: center !important;
            }
            .total-section {
                margin-top: 20px;
                text-align: right;
            }
            .total-amount {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-top: 10px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-style: italic;
            }
            /* Mobile Responsive Styles */
            @media (max-width: 768px) {
                body {
                    padding: 10px;
                    font-size: 14px;
                }
                .receipt-container {
                    padding: 20px 15px;
                    border-radius: 0;
                    margin: 0;
                }
                .receipt-header h1 {
                    font-size: 22px;
                }
                .receipt-info {
                    margin-bottom: 15px;
                }
                .receipt-info p {
                    font-size: 13px;
                    margin: 6px 0;
                }
                .receipt-info strong {
                    width: 120px;
                    font-size: 13px;
                }
                
                /* Mobile Table Styles */
                .items-table {
                    font-size: 12px;
                    margin: 15px 0;
                }
                .items-table th {
                    padding: 10px 6px;
                    font-size: 12px;
                }
                .items-table th:nth-child(1) {
                    width: 40%;
                }
                .items-table th:nth-child(2) {
                    width: 15%;
                }
                .items-table th:nth-child(3) {
                    width: 22.5%;
                }
                .items-table th:nth-child(4) {
                    width: 22.5%;
                }
                .items-table td {
                    padding: 10px 6px;
                    font-size: 12px;
                    line-height: 1.3;
                }
                .items-table td small {
                    font-size: 10px;
                    margin-top: 2px;
                }
                
                .total-section {
                    margin-top: 15px;
                }
                .total-section p {
                    font-size: 16px;
                }
                .total-amount {
                    font-size: 20px;
                }
                .print-btn {
                    width: 100%;
                    padding: 15px;
                    font-size: 16px;
                    margin: 15px 0;
                }
            }
            
            /* Extra Small Mobile Devices */
            @media (max-width: 480px) {
                .receipt-container {
                    padding: 15px 10px;
                }
                .receipt-header h1 {
                    font-size: 20px;
                }
                
                /* Table wrapper for horizontal scroll if needed */
                .table-wrapper {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    margin: 15px -10px;
                    padding: 0 10px;
                }
                
                .items-table {
                    font-size: 11px;
                    min-width: 320px; /* Minimum width to prevent crushing */
                }
                .items-table th {
                    padding: 8px 4px;
                    font-size: 11px;
                    white-space: nowrap;
                }
                .items-table th:nth-child(1) {
                    width: 35%;
                    min-width: 120px;
                }
                .items-table th:nth-child(2) {
                    width: 18%;
                    min-width: 50px;
                }
                .items-table th:nth-child(3) {
                    width: 23.5%;
                    min-width: 70px;
                }
                .items-table th:nth-child(4) {
                    width: 23.5%;
                    min-width: 80px;
                }
                .items-table td {
                    padding: 8px 4px;
                    font-size: 11px;
                }
                .items-table td:nth-child(1) {
                    min-width: 120px;
                }
                .items-table td:nth-child(2) {
                    min-width: 50px;
                }
                .items-table td:nth-child(3) {
                    min-width: 70px;
                }
                .items-table td:nth-child(4) {
                    min-width: 80px;
                }
                .items-table td small {
                    font-size: 9px;
                    white-space: normal;
                }
                .receipt-info strong {
                    width: 100px;
                    font-size: 12px;
                }
                .total-amount {
                    font-size: 18px;
                }
            }
            
            /* Landscape Mobile Orientation */
            @media (max-width: 768px) and (orientation: landscape) {
                .items-table th:nth-child(1) {
                    width: 45%;
                }
                .items-table th:nth-child(2) {
                    width: 12%;
                }
                .items-table th:nth-child(3) {
                    width: 21.5%;
                }
                .items-table th:nth-child(4) {
                    width: 21.5%;
                }
                .receipt-container {
                    padding: 15px;
                }
            }
            
            /* Touch Device Optimizations */
            @media (hover: none) and (pointer: coarse) {
                .print-btn {
                    min-height: 48px;
                    touch-action: manipulation;
                }
                .items-table {
                    -webkit-overflow-scrolling: touch;
                }
            }
            
            /* High DPI Displays */
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                .items-table {
                    border-width: 0.5px;
                }
                .items-table th,
                .items-table td {
                    border-width: 0.5px;
                }
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
                background: #2196F3;
                color: white;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                border-radius: 5px;
                cursor: pointer;
                margin: 20px 0;
            }
            .print-btn:hover {
                background: #1976D2;
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
            
            <div class="table-wrapper">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($orderItems as $item): 
                            $itemTotal = $item['quantity'] * $item['price'];
                            
                            // Build item name with size and toppings
                            $itemName = htmlspecialchars($item['food_name']);
                            
                            // Add size if available
                            if (!empty($item['size'])) {
                                $itemName .= ' (' . ucfirst($item['size']) . ')';
                            }
                            
                            // Add toppings if available
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
                                        $itemName .= '<br><small style="color: #666; font-style: italic; font-size: 12px; margin-top: 4px; display: block;">+ ' . implode(', ', $toppingNames) . '</small>';
                                    }
                                }
                            }
                        ?>
                        <tr>
                            <td><?php echo $itemName; ?></td>
                            <td><?php echo $item['quantity']; ?></td>
                            <td>₱<?php echo number_format($item['price'], 2); ?></td>
                            <td>₱<?php echo number_format($itemTotal, 2); ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            
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