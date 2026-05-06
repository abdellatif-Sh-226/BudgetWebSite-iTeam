<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SharedBudget extends Model {
    protected $table = 'shared_budgets';
    public $timestamps = true;
    protected $fillable = [
        'id', 'owner_id', 'name',
        'description', 'limit_amount', 'locked'
    ];

    public function owner() {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members() {
        return $this->belongsToMany(
            User::class,
            'shared_budget_members',
            'shared_budget_id',
            'user_id'
        );
    }

    public function categories() {
        return $this->hasMany(Category::class, 'shared_budget_id');
    }
}