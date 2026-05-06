<?php
namespace App\Middleware;

use App\Services\AuthService;

class AuthMiddleware {

    public static function handle(): string {
        $headers = getallheaders();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!$auth || !str_starts_with($auth, 'Bearer ')) {
            http_response_code(401);
            echo json_encode(['error' => 'Token manquant']);
            exit;
        }

        $token = substr($auth, 7);

        try {
            $decoded = (new AuthService())->validateToken($token);
            return $decoded->sub;
        } catch (\Firebase\JWT\ExpiredException $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Token expiré']);
            exit;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Token invalide']);
            exit;
        }
    }

    public static function handleAdmin(): string {
        $headers = getallheaders();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!$auth || !str_starts_with($auth, 'Bearer ')) {
            http_response_code(401);
            echo json_encode(['error' => 'Token manquant']);
            exit;
        }

        $token = substr($auth, 7);

        try {
            $decoded = (new AuthService())->validateToken($token);

            if ($decoded->role !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Accès refusé - Admin requis']);
                exit;
            }

            return $decoded->sub;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Token invalide']);
            exit;
        }
    }
}