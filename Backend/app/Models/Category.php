<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model {
    protected $table = 'transactions';
    public $timestamps = true;
    protected $fillable = [
        'id', 'user_id', 'type', 'description',
        'amount', 'date', 'category_id', 'notes',
        'destination_type', 'destination_id'
    ];

    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category() {
        return $this->belongsTo(Category::class, 'category_id');
    }
}