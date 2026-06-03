<?php
use Illuminate\Database\Capsule\Manager as Capsule;

if (!Capsule::schema()->hasTable('budgets')) {
    Capsule::schema()->create('budgets', function ($table) {
        $table->string('id', 36)->primary();
        $table->string('user_id', 36);
        $table->string('name', 150);
        $table->enum('period', ['monthly', 'weekly', 'custom'])->default('monthly');
        $table->decimal('limit_amount', 12, 2)->default(0);
        $table->string('category_id', 36)->nullable();
        $table->date('start_date');
        $table->date('end_date');
        $table->timestamps();

        $table->foreign('user_id')
              ->references('id')->on('users')
              ->onDelete('cascade');

        $table->foreign('category_id')
              ->references('id')->on('categories')
              ->onDelete('set null');
    });
    echo "✓ budgets table created\n";
} else {
    echo "⚠ budgets table already exists\n";
}