<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserService
{
    protected function sanitizeUserData(array $data): array
    {
        $sanitized = [];

        if (($data['image'] ?? null) instanceof UploadedFile) {
            $image = $data['image'];
            $sanitized['img'] = 'data:'.$image->getMimeType().';base64,'.base64_encode($image->get());
        } elseif (in_array($data['remove_image'] ?? false, [true, 1, '1'], true)) {
            $sanitized['img'] = null;
        }

        foreach (['name', 'address', 'phone', 'cellphone_number', 'billing_name', 'billing_address', 'billing_city', 'billing_postal_code', 'billing_country', 'payment_method', 'payment_reference'] as $field) {
            if (array_key_exists($field, $data)) {
                $sanitized[$field] = is_string($data[$field]) && $data[$field] !== ''
                    ? trim(strip_tags($data[$field]))
                    : ($data[$field] === '' ? null : $data[$field]);
            }
        }

        if (array_key_exists('email', $data)) {
            $sanitized['email'] = is_string($data['email'])
                ? strtolower(trim($data['email']))
                : $data['email'];
        }

        if (array_key_exists('birth_date', $data)) {
            $sanitized['birth_date'] = ! empty($data['birth_date'])
                ? Carbon::parse($data['birth_date'])->format('Y-m-d')
                : null;
        }

        foreach (['latitude', 'longitude'] as $coordinate) {
            if (array_key_exists($coordinate, $data)) {
                $sanitized[$coordinate] = filled($data[$coordinate])
                    ? (float) $data[$coordinate]
                    : null;
            }
        }

        if (array_key_exists('role_id', $data)) {
            $sanitized['role_id'] = $data['role_id'] !== null
                ? (int) $data['role_id']
                : null;
        }

        if (array_key_exists('password', $data)) {
            $sanitized['password'] = $data['password'];
        }

        return $sanitized;
    }

    public function getPaginatedUsers(array $filters = []): LengthAwarePaginator
    {
        return User::paginated($filters);
    }

    public function getAllRoles(): Collection
    {
        return Role::allRoles();
    }

    public function getUserWithRoles(User $user): User
    {
        return $user->load('roles');
    }

    public function createUser(array $data): User
    {
        $data = $this->sanitizeUserData($data);

        return DB::transaction(function () use ($data) {
            $age = ! empty($data['birth_date'])
                ? Carbon::parse($data['birth_date'])->age
                : null;

            $user = User::create([
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
                'password' => Hash::make($data['password']),
                'birth_date' => $data['birth_date'] ?? null,
                'age' => $age,
                'address' => $data['address'] ?? null,
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'img' => $data['img'] ?? null,
                'phone' => $data['phone'] ?? null,
                'billing_name' => $data['billing_name'] ?? null,
                'billing_address' => $data['billing_address'] ?? null,
                'billing_city' => $data['billing_city'] ?? null,
                'billing_postal_code' => $data['billing_postal_code'] ?? null,
                'billing_country' => $data['billing_country'] ?? null,
                'payment_method' => $data['payment_method'] ?? null,
                'payment_reference' => $data['payment_reference'] ?? null,
            ]);

            if (! empty($data['role_id'])) {
                $user->syncRoles(Role::findOrFail($data['role_id']));
            }

            return $user;
        });
    }

    public function registerCustomer(array $data): User
    {
        return DB::transaction(function () use ($data): User {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ]);
            $customerRole = Role::firstOrCreate([
                'name' => 'Customer',
                'guard_name' => 'web',
            ]);
            $user->assignRole($customerRole);

            return $user;
        });
    }

    public function needsProfileCompletion(User $user): bool
    {
        return $user->isCustomer() && ! $user->hasCompletedProfile();
    }

    public function completeProfile(User $user, array $data): void
    {
        $birthDate = Carbon::parse($data['birth_date']);

        $sanitized = $this->sanitizeUserData($data);

        $user->forceFill([
            'birth_date' => $birthDate->toDateString(),
            'age' => $birthDate->age,
            'address' => $sanitized['address'] ?? null,
            'cellphone_number' => $sanitized['cellphone_number'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'billing_name' => $sanitized['billing_name'] ?? $user->name,
            'billing_address' => $sanitized['billing_address'] ?? null,
            'billing_city' => $sanitized['billing_city'] ?? null,
            'billing_postal_code' => $sanitized['billing_postal_code'] ?? null,
            'billing_country' => 'Philippines',
            'phone' => $sanitized['cellphone_number'] ?? null,
        ])->save();
    }

    public function updateProfileSettings(User $user, array $data): void
    {
        $data = $this->sanitizeUserData($data);
        $user->fill($data);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();
    }

    public function updatePassword(User $user, string $password): void
    {
        $user->update([
            'password' => Hash::make($password),
        ]);
    }

    public function deleteAccount(User $user): bool
    {
        return DB::transaction(fn () => $user->delete());
    }

    public function updateUser(User $user, array $data): bool
    {
        $data = $this->sanitizeUserData($data);

        return DB::transaction(function () use ($user, $data) {
            $updateData = [];

            foreach (['name', 'email', 'address', 'latitude', 'longitude', 'img', 'phone', 'billing_name', 'billing_address', 'billing_city', 'billing_postal_code', 'billing_country', 'payment_method', 'payment_reference'] as $field) {
                if (array_key_exists($field, $data)) {
                    $updateData[$field] = $data[$field];
                }
            }

            if (array_key_exists('birth_date', $data)) {
                $updateData['birth_date'] = $data['birth_date'];
                $updateData['age'] = $data['birth_date']
                    ? Carbon::parse($data['birth_date'])->age
                    : null;
            }

            if (! empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            $updated = $user->update($updateData);

            if (! empty($data['role_id'])) {
                $user->syncRoles(Role::findOrFail($data['role_id']));
            }

            return $updated;
        });
    }

    public function deleteUser(User $user): bool
    {
        return DB::transaction(function () use ($user) {
            return $user->delete();
        });
    }
}
