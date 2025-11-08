<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');

session_start();

if (isset($_SESSION['admin_id']) && isset($_SESSION['admin_username'])) {
    echo json_encode([
        'success' => true,
        'logged_in' => true,
        'admin_id' => $_SESSION['admin_id'],
        'username' => $_SESSION['admin_username']
    ]);
} else {
    echo json_encode([
        'success' => true,
        'logged_in' => false
    ]);
}
?>