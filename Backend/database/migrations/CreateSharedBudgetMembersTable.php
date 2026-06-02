<?php
use Illuminate\Database\Capsule\Manager as Capsule;

if (!Capsule::schema()->hasTable('shared_budget_members')) {
    Capsule::schema()->create('shared_budget_members', function ($table) {
        $table->string('shared_budget_id', 36);
        $table->string('user_id', 36);

        $table->primary(['shared_budget_id', 'user_id']);

        $table->foreign('shared_budget_id')
              ->references('id')->on('shared_budgets')
              ->onDelete('cascade');

        $table->foreign('user_id')
              ->references('id')->on('users')
              ->onDelete('cascade');
    });
    echo "✓ shared_budget_members table created\n";
} else {
    echo "⚠ shared_budget_members table already exists\n";
}