<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

require __DIR__ . '/../config/db.php';

echo "Running migrations...\n\n";

try {
    require __DIR__ . '/migrations/CreateUsersTable.php';
    require __DIR__ . '/migrations/CreateCategoriesTable.php';
    require __DIR__ . '/migrations/CreateSharedBudgetsTable.php';
    require __DIR__ . '/migrations/CreateSharedBudgetMembersTable.php';
    require __DIR__ . '/migrations/CreateTransactionsTable.php';
    require __DIR__ . '/migrations/CreateBudgetsTable.php';
    echo "\nAll migrations completed!";
} catch (\Exception $e) {
    echo "\nERROR: " . $e->getMessage();
    echo "\nFile: " . $e->getFile();
    echo "\nLine: " . $e->getLine();
}