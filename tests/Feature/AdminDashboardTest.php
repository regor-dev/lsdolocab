<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Role;
use App\Models\User;
use App\Services\AdminDashboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\Concerns\ActsAsAdmin;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;
    use ActsAsAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        foreach (['Admin', 'Staff', 'Customer'] as $roleName) {
            Role::query()->firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }
    }

    private function dashboardUser(?string $role): User
    {
        $user = User::factory()->create([
            'birth_date' => '1995-01-01',
            'address' => '123 Test St',
            'cellphone_number' => '09170000000',
        ]);

        if ($role) {
            $roleInstance = Role::query()->where('name', $role)->where('guard_name', 'web')->first();
            $user->assignRole($roleInstance);
        }

        return $user;
    }

    public function test_shows_full_dashboard_to_admins(): void
    {
        $this->actingAsAdmin();

        $this->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('dashboard')
                ->where('canManage', true)
                ->has('overview')
                ->has('inventory.statuses', 3)
                ->has('staffs')
                ->has('recentOrders'));
    }

    public function test_staff_are_redirected_to_stocks_from_dashboard(): void
    {
        $staff = $this->dashboardUser('Staff');

        $this->actingAs($staff)
            ->get('/dashboard')
            ->assertRedirect('/stocks');
    }

    public function test_forbids_authenticated_users_that_have_no_role(): void
    {
        $this->actingAs($this->dashboardUser(null))
            ->get('/dashboard')
            ->assertForbidden();
    }

    public function test_sends_customers_to_the_storefront_not_the_admin_dashboard(): void
    {
        $this->actingAs($this->dashboardUser('Customer'))
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/index'));
    }

    public function test_counts_registered_and_guest_customers_once_each(): void
    {
        $registered = User::factory()->create();

        Order::factory()->count(2)->create(['user_id' => $registered->id]);
        Order::factory()->count(2)->create(['user_id' => null, 'customer_email' => 'guest@example.test']);
        Order::factory()->create(['user_id' => null, 'customer_email' => null, 'customer_name' => 'Walk In']);

        $overview = app(AdminDashboardService::class)->summary()->overview;

        $this->assertSame(5, $overview['orders']);
        $this->assertSame(3, $overview['customers']);
    }

    public function test_serves_repeat_loads_from_cache_and_refreshes_after_order_changes(): void
    {
        $service = app(AdminDashboardService::class);

        $service->summary(); // warm

        DB::enableQueryLog();
        $service->summary();
        $this->assertEmpty(DB::getQueryLog());
        DB::disableQueryLog();

        $service->flush();
        Order::factory()->create();

        $this->assertSame(1, $service->summary()->overview['orders']);
    }
}
