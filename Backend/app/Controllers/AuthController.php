<?php
namespace App\Controllers;

use App\Services\AuthService;

class AuthController {

    private AuthService $authService;

    public function __construct() {
        $this->authService = new AuthService();
    }

    public function login(): void {
        $data = json_decode(file_get_contents('php://input'), true);

        $email    = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Email et mot de passe requis']);
            return;
        }

        try {
            $result = $this->authService->login($email, $password);
            http_response_code(200);
            echo json_encode($result);
        } catch (\Exception $e) {
            http_response_code($e->getCode() ?: 401);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function logout(): void {
        echo json_encode(['success' => true, 'message' => 'Déconnecté']);
    }
}