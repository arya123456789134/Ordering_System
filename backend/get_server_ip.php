<?php
function getServerIP() {
    $ip = '';
    
    if (!empty($_SERVER['SERVER_ADDR'])) {
        $ip = $_SERVER['SERVER_ADDR'];
    }
    elseif (!empty($_SERVER['HTTP_HOST'])) {
        $host = $_SERVER['HTTP_HOST'];
        $ip = explode(':', $host)[0];
    }
    elseif (!empty($_SERVER['REMOTE_ADDR'])) {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    else {
        $ip = getLocalIP();
    }
    
    if (empty($ip) || $ip === '127.0.0.1' || $ip === '::1') {
        $ip = getLocalIP();
    }
    
    return $ip;
}

function getLocalIP() {
    $ips = [];
    
    if (PHP_OS_FAMILY === 'Windows') {
        $output = shell_exec('ipconfig');
        if (preg_match_all('/IPv4.*?(\d+\.\d+\.\d+\.\d+)/', $output, $matches)) {
            $ips = $matches[1];
        }
    } else {
        $output = shell_exec('ip addr show 2>/dev/null || ifconfig 2>/dev/null');
        if (preg_match_all('/(\d+\.\d+\.\d+\.\d+)/', $output, $matches)) {
            $ips = $matches[1];
        }
    }
    
    $filtered_ips = array_filter($ips, function($ip) {
        return $ip !== '127.0.0.1' && 
               $ip !== '::1' && 
               !preg_match('/^192\.168\./', $ip) && 
               !preg_match('/^10\./', $ip) && 
               !preg_match('/^172\.(1[6-9]|2[0-9]|3[0-1])\./', $ip);
    });
    
    if (!empty($filtered_ips)) {
        return array_values($filtered_ips)[0];
    }
    
    $private_ips = array_filter($ips, function($ip) {
        return $ip !== '127.0.0.1' && $ip !== '::1';
    });
    
    if (!empty($private_ips)) {
        return array_values($private_ips)[0];
    }
    
    return 'localhost';
}

$serverIP = getServerIP();
$port = !empty($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] != '80' ? ':' . $_SERVER['SERVER_PORT'] : '';

$directory = '/Ordering_System';

$baseURL = 'http://' . $serverIP . $port . $directory;
$menuURL = $baseURL . '/menu.html';

header('Content-Type: application/json');
echo json_encode([
    'ip' => $serverIP,
    'baseURL' => $baseURL,
    'menuURL' => $menuURL,
    'directory' => $directory
]);
?>