<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UsersIndexTest extends TestCase
{
    use RefreshDatabase;

    const PNG_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['Admin', 'Staff', 'Customer', 'SuperAdmin'] as $role) {
            Role::query()->firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function usersTestActor(string $role = 'Admin'): User
    {
        $user = User::factory()->create([
            'birth_date' => '1995-01-01',
            'address' => '123 Test St',
            'cellphone_number' => '09170000000',
        ]);
        $user->assignRole($role);

        return $user;
    }

    public function test_lists_users_without_the_avatar_blob_or_billing_columns(): void
    {
        User::factory()->create(['img' => self::PNG_DATA_URI, 'billing_name' => 'Secret', 'payment_reference' => 'ABC']);

        $this->actingAs($this->usersTestActor())
            ->get('/admin/user')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('user/index')
                ->has('users.data', 2)
                ->has('roles')
                ->missing('users.data.0.img')
                ->missing('users.data.0.billing_name')
                ->missing('users.data.0.payment_reference')
                ->has('users.data.0.has_img'));
    }

    public function test_searches_by_name_or_email(): void
    {
        User::factory()->create(['name' => 'Zed Alpha', 'email' => 'zed@example.test']);
        User::factory()->create(['name' => 'Someone Else', 'email' => 'needle@example.test']);

        $this->actingAs($this->usersTestActor())
            ->get('/admin/user?search=needle@')
            ->assertInertia(fn (Assert $page) => $page->has('users.data', 1));
    }

    public function test_filters_roles_by_exact_name(): void
    {
        User::factory()->create()->assignRole('SuperAdmin');

        $this->actingAs($this->usersTestActor('Admin'))
            ->get('/admin/user?role=Admin')
            ->assertInertia(fn (Assert $page) => $page->has('users.data', 1));
    }

    public function test_serves_a_cacheable_avatar_and_answers_304_on_a_matching_etag(): void
    {
        $user = User::factory()->create(['img' => self::PNG_DATA_URI]);
        $admin = $this->usersTestActor();

        $first = $this->actingAs($admin)->get("/admin/user/{$user->id}/avatar")
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');

        $this->actingAs($admin)
            ->withHeaders(['If-None-Match' => $first->headers->get('ETag')])
            ->get("/admin/user/{$user->id}/avatar")
            ->assertStatus(304);
    }

    public function test_returns_404_when_the_user_has_no_avatar(): void
    {
        $user = User::factory()->create(['img' => null]);

        $this->actingAs($this->usersTestActor())->get("/admin/user/{$user->id}/avatar")->assertNotFound();
    }

    public function test_keeps_the_users_area_admin_only(): void
    {
        $this->actingAs($this->usersTestActor('Staff'))->get('/admin/user')->assertForbidden();
    }
}
