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

session_start();

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $currentPassword = $data['current_password'] ?? '';
    $newPassword = $data['new_password'] ?? '';
    
    if (empty($currentPassword) || empty($newPassword)) {
        http_response_code(400);
        echo json_encode(['error' => 'Current password and new password are required']);
        exit;
    }
    
    if (strlen($newPassword) < 4) {
        http_response_code(400);
        echo json_encode(['error' => 'New password must be at least 4 characters long']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT password FROM admin WHERE id = ?");
        $stmt->execute([$_SESSION['admin_id']]);
        $admin = $stmt->fetch();
        
        if (!$admin) {
            http_response_code(404);
            echo json_encode(['error' => 'Admin not found']);
            exit;
        }
        
        if (!password_verify($currentPassword, $admin['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Current password is incorrect']);
            exit;
        }
        
        $hashedNewPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("UPDATE admin SET password = ? WHERE id = ?");
        $stmt->execute([$hashedNewPassword, $_SESSION['admin_id']]);
        
        echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error occurred']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>