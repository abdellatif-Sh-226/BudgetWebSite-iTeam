<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Budget extends Model {
    protected $table = 'budgets';
    public $timestamps = true;
    protected $fillable = [
        'id', 'user_id', 'name', 'period',
        'limit_amount', 'category_id',
        'start_date', 'end_date'
    ];

    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category() {
        return $this->belongsTo(Category::class, 'category_id');
    }
}