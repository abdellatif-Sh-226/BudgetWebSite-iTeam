<?php
use App\Controllers\AuthController;
use App\Middleware\AuthMiddleware;

$router = new \Bramus\Router\Router();

$router->get('/', function () {
    echo json_encode([
        'message' => 'BudgetCollab API is running',
        'version' => '1.0'
    ]);
});

$router->post('/auth/login', function () {
    (new AuthController())->login();
});

$router->post('/auth/logout', function () {
    AuthMiddleware::handle();
    (new AuthController())->logout();
});

$router->run();