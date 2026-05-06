<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SharedBudgetMember extends Model {
    protected $table = 'shared_budget_members';
    public $timestamps = false;
    protected $fillable = ['shared_budget_id', 'user_id'];
}