<?php

namespace Tests\Feature\Auth;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register()
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('profile.complete', absolute: false));

        $this->get('/dashboard')->assertRedirect(route('profile.complete', absolute: false));

        $this->get('/profile/complete')->assertInertia(fn (AssertableInertia $page) => $page
            ->component('auth/complete-profile'));

        $this->patch('/profile/complete', [
            'birth_date' => '2000-01-01',
            'address' => '  <b>123 Main Street</b>  ',
            'cellphone_number' => '09123456789',
            'latitude' => '14.5995',
            'longitude' => '120.9842',
        ])->assertRedirect(route('shop', absolute: false));

        $user = \App\Models\User::query()->where('email', 'test@example.com')->firstOrFail();
        $this->assertSame('2000-01-01', $user->birth_date);
        $this->assertSame('09123456789', $user->cellphone_number);
        $this->assertSame(Carbon::parse('2000-01-01')->age, $user->age);
        $this->assertSame('123 Main Street', $user->address);
        $this->assertEquals(14.5995, (float) $user->latitude);
        $this->assertEquals(120.9842, (float) $user->longitude);
        $this->get('/dashboard')->assertOk();
    }

    public function test_profile_completion_rejects_future_birth_dates_and_empty_addresses(): void
    {
        $this->post('/register', [
            'name' => 'Incomplete User',
            'email' => 'incomplete@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->patch('/profile/complete', [
            'birth_date' => now()->toDateString(),
            'address' => ' ',
            'cellphone_number' => '09123456789',
        ])->assertSessionHasErrors(['birth_date', 'address']);

        $this->get('/dashboard')->assertRedirect(route('profile.complete', absolute: false));
    }

    public function test_profile_completion_rejects_birth_dates_over_100_years_old(): void
    {
        $this->post('/register', [
            'name' => 'Too Old User',
            'email' => 'too-old@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->patch('/profile/complete', [
            'birth_date' => now()->subYears(100)->subDay()->toDateString(),
            'address' => '123 Main Street',
            'cellphone_number' => '09123456789',
        ])->assertSessionHasErrors('birth_date');
    }

    public function test_profile_completion_accepts_a_birth_date_at_the_100_year_limit(): void
    {
        $this->post('/register', [
            'name' => 'Hundred Year User',
            'email' => 'hundred-year@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->patch('/profile/complete', [
            'birth_date' => now()->subYears(100)->toDateString(),
            'address' => '123 Main Street',
            'cellphone_number' => '09123456789',
        ])->assertSessionHasNoErrors();
    }
}
