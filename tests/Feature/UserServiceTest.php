<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_filters_users_by_exact_role_name(): void
    {
        $adminRole = Role::query()->firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $staffRole = Role::query()->firstOrCreate(['name' => 'Staff', 'guard_name' => 'web']);

        $adminUser = User::factory()->create();
        $adminUser->assignRole($adminRole);

        $staffUser = User::factory()->create();
        $staffUser->assignRole($staffRole);

        // Exact role name match returns only the admin user.
        $result = app(UserService::class)->getPaginatedUsers(['role' => 'Admin']);

        $this->assertCount(1, $result->items());
        $this->assertSame($adminUser->id, $result->first()->id);
        $this->assertNotContains($staffUser->id, $result->pluck('id')->all());

        // A non-existent role name returns no users.
        $empty = app(UserService::class)->getPaginatedUsers(['role' => 'Nonexistent']);
        $this->assertCount(0, $empty->items());
    }
}
