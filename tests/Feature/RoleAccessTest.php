<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\Concerns\ActsAsAdmin;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;
    use ActsAsAdmin;

    public function test_staff_and_customers_can_only_see_the_dashboard_without_order_details(): void
    {
        Order::factory()->create([
            'order_number' => 'ORD-PRIVATE-001',
            'customer_name' => 'Private Customer',
        ]);

        foreach (['Staff', 'Customer'] as $roleName) {
            $role = Role::factory()->create(['role_name' => $roleName]);
            $user = User::factory()->create();
            $user->assignRole($role);

            if ($roleName === 'Customer') {
                // Customers must complete their profile before reaching the dashboard
                $user->forceFill([
                    'birth_date' => '2000-01-01',
                    'address' => '123 Main Street',
                    'cellphone_number' => '09123456789',
                ])->save();

                $this->actingAs($user)
                    ->get('/dashboard')
                    ->assertInertia(function (AssertableInertia $page): void {
                        $page->component('storefront/index')
                            ->where('auth.user.roles.0.role_name', 'Customer')
                            ->has('products');
                    });
            } else {
                // Staff are redirected from the dashboard to the stocks page
                $this->actingAs($user)
                    ->get('/dashboard')
                    ->assertRedirect('/stocks');
            }

            $this->get('/admin/orders')->assertForbidden();
            $this->get('/admin/orderlog')->assertForbidden();
            $this->post('/admin/orderlog', [])->assertForbidden();
        }
    }

    public function test_users_without_a_role_cannot_access_management_routes(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/admin/orderlog')
            ->assertForbidden();
    }

    public function test_profile_completion_is_required_only_for_customers(): void
    {
        foreach (['Admin', 'Staff', 'Customer'] as $roleName) {
            $role = Role::factory()->create(['role_name' => $roleName]);
            $user = User::factory()->create([
                'birth_date' => null,
                'age' => null,
                'address' => null,
            ]);
            $user->assignRole($role);

            $this->actingAs($user);

            if ($roleName === 'Customer') {
                $this->get('/dashboard')->assertRedirect('/profile/complete');
                $this->get('/profile/complete')->assertInertia(fn (AssertableInertia $page) => $page
                    ->component('auth/complete-profile'));
            } elseif ($roleName === 'Staff') {
                // Staff are redirected from the dashboard to the stocks page
                $this->get('/dashboard')->assertRedirect('/stocks');
            } else {
                $this->get('/dashboard')->assertOk();
                $this->get('/profile/complete')->assertRedirect('/dashboard');
                $this->patch('/profile/complete', [])->assertForbidden();
            }
        }
    }

    public function test_admins_keep_access_to_management_and_order_logs(): void
    {
        $this->actingAsAdmin();

        $this->get('/dashboard')->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->where('auth.user.roles.0.role_name', 'Admin')
            ->where('canManage', true));
        $this->get('/admin/orders')->assertOk();
        $this->get('/admin/orderlog')->assertOk();
    }

    public function test_registration_assigns_the_customer_role(): void
    {
        $this->post('/register', [
            'name' => 'New Customer',
            'email' => 'new-customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertRedirect('/profile/complete');

        $user = User::query()->where('email', 'new-customer@example.com')->firstOrFail();
        $this->assertTrue($user->hasRole('Customer'));
        $this->get('/admin/orderlog')->assertForbidden();
    }

    public function test_staff_login_redirects_to_the_stocks_page(): void
    {
        $role = Role::factory()->create(['role_name' => 'Staff']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/stocks');

        // Once logged in, Staff are taken from the dashboard to the stocks page
        $this->get('/dashboard')->assertRedirect('/stocks');
    }
}
