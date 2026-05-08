<?php
use Illuminate\Database\Capsule\Manager as Capsule;
if (!Capsule::schema()->hasTable("users")) {
    Capsule::schema()->create("users", function ($table) {
        $table->string("id", 36)->primary();
        $table->string("name", 100);
        $table->string("email", 150)->unique();
        $table->string("password", 255);
        $table->enum("role", ["admin", "user"])->default("user");
        $table->boolean("active")->default(true);
        $table->boolean("delete_request")->default(false);
        $table->timestamps();
    });
    echo "users table created\n";
} else {
    echo "users table already exists\n";
}
