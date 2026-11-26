<?php

namespace Tests\Concerns;

use App\Models\Role;
use App\Models\User;

trait ActsAsAdmin
{
    protected function actingAsAdmin(array $attributes = []): User
    {
        $role = Role::query()->firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $user = User::factory()->create($attributes);
        $user->assignRole($role);

        $this->actingAs($user);

        return $user;
    }
}
