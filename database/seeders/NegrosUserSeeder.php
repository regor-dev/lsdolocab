<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class NegrosUserSeeder extends Seeder
{
    /**
     * Seed realistic accounts based in City of Victorias, Negros Occidental.
     *
     * Idempotent: every account is matched by email via updateOrCreate, so
     * re-running this seeder updates existing rows instead of duplicating them.
     */
    public function run(): void
    {
        $latitude = 10.9000;
        $longitude = 123.0730;
        $postalCode = '6119';

        // Roles referenced by the accounts below (idempotent).
        $adminRole = Role::query()->firstOrCreate(['name' => Role::ADMIN, 'guard_name' => 'web']);
        $staffRole = Role::query()->firstOrCreate(['name' => Role::STAFF, 'guard_name' => 'web']);
        $riderRole = Role::query()->firstOrCreate(['name' => 'Delivery Rider', 'guard_name' => 'web']);
        $customerRole = Role::query()->firstOrCreate(['name' => Role::CUSTOMER, 'guard_name' => 'web']);

        $accounts = [
            [
                'name' => 'Reyes, Admin',
                'email' => 'admin@victorias.seed',
                'password' => 'password',
                'role' => $adminRole,
                'birth_date' => '1988-03-12',
                'age' => 38,
                'address' => 'Guanzon Street, Poblacion, City of Victorias, Negros Occidental',
                'cellphone_number' => '+639171234567',
                'phone' => '+639171234567',
                'latitude' => $latitude,
                'longitude' => $longitude,
                'billing_city' => 'Victorias',
                'billing_postal_code' => $postalCode,
                'billing_country' => 'Philippines',
            ],
            [
                'name' => 'Santos, Maria - Store Manager',
                'email' => 'staff@victorias.seed',
                'password' => 'password',
                'role' => $staffRole,
                'birth_date' => '1994-07-22',
                'age' => 32,
                'address' => 'Osmena Avenue, Barangay XI, City of Victorias, Negros Occidental',
                'cellphone_number' => '+639178765432',
                'phone' => '+639178765432',
                'latitude' => $latitude,
                'longitude' => $longitude,
                'billing_city' => 'Victorias',
                'billing_postal_code' => $postalCode,
                'billing_country' => 'Philippines',
            ],
            [
                'name' => 'Delos Reyes, Jason - Delivery Rider',
                'email' => 'rider@victorias.seed',
                'password' => 'password',
                'role' => $riderRole,
                'birth_date' => '1997-11-05',
                'age' => 29,
                'address' => 'Rizal Street, Barangay VIII, City of Victorias, Negros Occidental',
                'cellphone_number' => '+639181122334',
                'phone' => '+639181122334',
                'latitude' => $latitude,
                'longitude' => $longitude,
                'billing_city' => 'Victorias',
                'billing_postal_code' => $postalCode,
                'billing_country' => 'Philippines',
            ],
            [
                'name' => 'Reyes, Datu - Sneakerhead Customer',
                'email' => 'customer@victorias.seed',
                'password' => 'password',
                'role' => $customerRole,
                'birth_date' => '1999-01-18',
                'age' => 27,
                'address' => 'Lopez Jaena Street, Barangay XIII, City of Victorias, Negros Occidental',
                'cellphone_number' => '+639195566778',
                'phone' => '+639195566778',
                'latitude' => $latitude,
                'longitude' => $longitude,
                'billing_name' => 'Datu Reyes',
                'billing_address' => 'Lopez Jaena Street, Barangay XIII, City of Victorias, Negros Occidental',
                'billing_city' => 'Victorias',
                'billing_postal_code' => $postalCode,
                'billing_country' => 'Philippines',
                'payment_method' => 'cod',
            ],
        ];

        foreach ($accounts as $account) {
            $role = $account['role'];
            unset($account['role']);

            User::query()->updateOrCreate(
                ['email' => $account['email']],
                array_merge($account, [
                    'email_verified_at' => now(),
                ])
            )->syncRoles($role);
        }
    }
}
