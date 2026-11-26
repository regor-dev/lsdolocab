<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActsAsAdmin;
use Tests\TestCase;

class UserLocationTest extends TestCase
{
    use RefreshDatabase;
    use ActsAsAdmin;

    public function test_user_coordinates_are_validated_and_saved(): void
    {
        $this->actingAsAdmin();
        $role = Role::factory()->create();

        $this->post('/admin/user', [
            'name' => 'Mapped User',
            'email' => 'mapped-user@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role_id' => $role->id,
            'address' => 'Manila, Philippines',
            'latitude' => '14.5995',
            'longitude' => '120.9842',
        ])->assertRedirect('/admin/user');

        $user = User::query()->where('email', 'mapped-user@example.com')->firstOrFail();
        $this->assertEquals(14.5995, (float) $user->latitude);
        $this->assertEquals(120.9842, (float) $user->longitude);

        $this->post('/admin/user', [
            'name' => 'Invalid Map User',
            'email' => 'invalid-map-user@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role_id' => $role->id,
            'latitude' => '91',
            'longitude' => '181',
        ])->assertSessionHasErrors(['latitude', 'longitude']);

        $this->assertDatabaseMissing('users', ['email' => 'invalid-map-user@example.com']);
    }
}
