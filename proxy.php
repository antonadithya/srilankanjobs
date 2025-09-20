<?php
/**
 * Simple PHP proxy to bypass CORS issues with Google Sheets
 * Usage: proxy.php?url=https://docs.google.com/spreadsheets/...
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: text/csv');
// Disable caching to ensure fresh counts
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if (!isset($_GET['url'])) {
    http_response_code(400);
    echo "Error: Missing 'url' parameter";
    exit;
}

$url = $_GET['url'];

// Validate that it's a Google Sheets URL
if (!preg_match('/^https:\/\/docs\.google\.com\/spreadsheets\//', $url)) {
    http_response_code(400);
    echo "Error: Invalid URL. Must be a Google Sheets URL.";
    exit;
}

// Fetch the data
$context = stream_context_create([
    'http' => [
        'timeout' => 30,
        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'header' => "Cache-Control: no-cache\r\nPragma: no-cache\r\n"
    ]
]);

$data = file_get_contents($url, false, $context);

if ($data === false) {
    http_response_code(500);
    echo "Error: Failed to fetch data from Google Sheets";
    exit;
}

echo $data;
?>
