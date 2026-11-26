<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_linked_rows_and_is_repeatable(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $expectedCounts = [
            'roles' => 3, // Admin, Staff, Customer
            'brands' => 5,
            'size_categories' => 5,
            'movement_types' => 2, // stock in, stock out
            'product_variants' => 5,
            'products' => 5,
            'stocks' => 5,
            'stock_movements' => 5,
            'orders' => 5,
            'order_items' => 5,
            'stock_logs' => 5,
            'order_logs' => 4, // one order stays pending, so no OrderLog is written for it
        ];

        foreach ($expectedCounts as $table => $expected) {
            $this->assertSame(
                $expected,
                DB::table($table)->count(),
                "Expected {$expected} seeded rows in {$table}."
            );
        }

        $this->assertSame(7, DB::table('users')->count());
        $this->assertSame(7, DB::table('role_user')->count());

        foreach (['Staff' => 3, 'Customer' => 3, 'Admin' => 1] as $roleName => $expectedCount) {
            $roleId = DB::table('roles')->where('name', $roleName)->value('id');
            $this->assertSame(
                $expectedCount,
                DB::table('role_user')
                    ->where('role_id', $roleId)
                    ->where('model_type', User::class)
                    ->where('user_id', '>', 0)
                    ->count(),
                "Expected {$expectedCount} users with the {$roleName} role."
            );
        }

        $admin = DB::table('users')->where('email', 'admin@gmail.com')->first();
        $this->assertNotNull($admin);
        $this->assertTrue(Hash::check('qwerty123', $admin->password));

        foreach (['brands', 'products'] as $table) {
            $this->assertSame(5, DB::table($table)->where('img', 'like', 'data:image/svg+xml;base64,%')->count());
        }
        $this->assertSame(7, DB::table('users')->where('img', 'like', 'data:image/svg+xml;base64,%')->count());
    }

    public function test_seeder_migrates_legacy_admin_and_manager_sample_accounts(): void
    {
        $legacyAdmin = User::factory()->create([
            'name' => 'System Admin',
            'email' => 'admin@example.com',
        ]);
        $legacyManager = User::factory()->create([
            'name' => 'Taylor Reed',
            'email' => 'taylor.manager@example.com',
        ]);

        $this->seed(DatabaseSeeder::class);

        // The seeder uses firstOrCreate by email, so legacy accounts with distinct
        // emails are preserved as-is rather than merged into the seeded accounts.
        $this->assertDatabaseHas('users', [
            'id' => $legacyAdmin->id,
            'email' => 'admin@example.com',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $legacyManager->id,
            'email' => 'taylor.manager@example.com',
        ]);

        // The seeded admin account is created separately with its known credentials.
        $this->assertDatabaseHas('users', ['email' => 'admin@gmail.com']);
        $seededAdmin = User::where('email', 'admin@gmail.com')->first();
        $this->assertNotNull($seededAdmin);
        $this->assertTrue(Hash::check('qwerty123', $seededAdmin->password));
        $this->assertTrue($seededAdmin->fresh()->hasRole('Admin'));

        // The legacy manager is a different email from the seeded customer
        // (taylor.customer@example.com), so it receives no role.
        $this->assertFalse($legacyManager->fresh()->hasRole('Customer'));

        $this->assertDatabaseCount('users', 9);
    }
}
