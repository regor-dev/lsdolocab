<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsAsAdmin;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;
    use ActsAsAdmin;

    public function test_shows_permission_counts_on_the_roles_index(): void
    {
        $this->actingAsAdmin();

        $role = Role::create(['name' => 'Editor', 'guard_name' => 'web']);
        $perm = Permission::create(['name' => 'brand.manage', 'guard_name' => 'web']);
        $role->syncPermissions([$perm]);

        $this->get('/admin/role')
            ->assertInertia(fn ($page) => $page
                ->component('resource-manager')
                ->where('records.data.0.permissions_count', 1));
    }

    public function test_syncs_permissions_on_role_update(): void
    {
        $this->actingAsAdmin();

        $role = Role::create(['name' => 'Editor2', 'guard_name' => 'web']);
        $perm = Permission::create(['name' => 'product.manage', 'guard_name' => 'web']);

        $response = $this->put("/admin/role/{$role->id}", [
            'role_name' => 'Editor2',
            'permissions' => ['product.manage'],
        ]);

        $response->assertRedirect('/role');

        $this->assertSame(['product.manage'], $role->fresh()->permissions->pluck('name')->all());
    }
}
