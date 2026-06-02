<?php
use Illuminate\Database\Capsule\Manager as Capsule;

if (!Capsule::schema()->hasTable('categories')) {
    Capsule::schema()->create('categories', function ($table) {
        $table->string('id', 36)->primary();
        $table->string('name', 100);
        $table->string('color', 7);
        $table->string('owner_id', 36)->nullable();
        $table->string('shared_budget_id', 36)->nullable();
        $table->timestamps();

        $table->foreign('owner_id')
              ->references('id')->on('users')
              ->onDelete('set null');
    });
    echo "✓ categories table created\n";
} else {
    echo "⚠ categories table already exists\n";
}