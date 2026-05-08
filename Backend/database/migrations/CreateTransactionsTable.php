<?php
use Illuminate\Database\Capsule\Manager as Capsule;
if (!Capsule::schema()->hasTable("transactions")) {
    Capsule::schema()->create("transactions", function ($table) {
        $table->string("id", 36)->primary();
        $table->string("user_id", 36);
        $table->enum("type", ["income", "expense"])->default("expense");
        $table->string("description", 255);
        $table->decimal("amount", 12, 2)->default(0);
        $table->date("date");
        $table->string("category_id", 36)->nullable();
        $table->text("notes")->nullable();
        $table->enum("destination_type", ["wallet", "budget", "shared"])->default("wallet");
        $table->string("destination_id", 36)->nullable();
        $table->timestamps();
        $table->foreign("user_id")->references("id")->on("users")->onDelete("cascade");
        $table->foreign("category_id")->references("id")->on("categories")->onDelete("set null");
    });
    echo "transactions table created\n";
} else {
    echo "transactions table already exists\n";
}
