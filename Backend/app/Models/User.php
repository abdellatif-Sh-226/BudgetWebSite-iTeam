<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model {
    protected $table = 'users';
    public $timestamps = true;
    protected $fillable = [
        'id', 'name', 'email', 'password',
        'role', 'active', 'delete_request'
    ];
    protected $hidden = ['password'];

    public function transactions() {
        return $this->hasMany(Transaction::class, 'user_id');
    }

    public function budgets() {
        return $this->hasMany(Budget::class, 'user_id');
    }

    public function categories() {
        return $this->hasMany(Category::class, 'owner_id');
    }

    public function sharedBudgets() {
        return $this->hasMany(SharedBudget::class, 'owner_id');
    }
}