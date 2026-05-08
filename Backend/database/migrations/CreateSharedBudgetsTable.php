<?php
use Illuminate\Database\Capsule\Manager as Capsule;
if (!Capsule::schema()->hasTable("shared_budgets")) {
    Capsule::schema()->create("shared_budgets", function ($table) {
        $table->string("id", 36)->primary();
        $table->string("owner_id", 36);
        $table->string("name", 150);
        $table->text("description")->nullable();
        $table->decimal("limit_amount", 12, 2)->default(0);
        $table->boolean("locked")->default(false);
        $table->timestamps();
        $table->foreign("owner_id")->references("id")->on("users")->onDelete("cascade");
    });
    echo "shared_budgets table created\n";
} else {
    echo "shared_budgets table already exists\n";
}
if (Capsule::schema()->hasTable("categories")) {
    try {
        Capsule::schema()->table("categories", function ($table) {
            $table->foreign("shared_budget_id")->references("id")->on("shared_budgets")->onDelete("set null");
        });
        echo "categories foreign key added\n";
    } catch (\Exception $e) {
        echo "foreign key already exists\n";
    }
}
