<?php
namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Models\User;

class AuthService {

    private string $secret;
    private int $ttl = 3600 * 24; // 24 hours

    public function __construct() {
        $this->secret = $_ENV['JWT_SECRET'];
    }

    public function login(string $email, string $password): array {
        $user = User::where('email', $email)->first();

        if (!$user) {
            throw new \Exception('Email ou mot de passe incorrect', 401);
        }

        if ($user->password !== $password) {
            throw new \Exception('Email ou mot de passe incorrect', 401);
        }

        if (!$user->active) {
            throw new \Exception('Compte désactivé', 403);
        }

        $payload = [
            'iss' => 'budgetcollab',
            'sub' => $user->id,
            'role' => $user->role,
            'iat' => time(),
            'exp' => time() + $this->ttl,
        ];

        $token = JWT::encode($payload, $this->secret, 'HS256');

        return [
            'token' => $token,
            'user'  => [
                'id'            => $user->id,
                'name'          => $user->name,
                'email'         => $user->email,
                'role'          => $user->role,
                'active'        => (bool) $user->active,
                'deleteRequest' => (bool) $user->delete_request,
                'createdAt'     => $user->created_at,
                'updatedAt'     => $user->updated_at,
            ]
        ];
    }

    public function validateToken(string $token): object {
        return JWT::decode($token, new Key($this->secret, 'HS256'));
    }
}