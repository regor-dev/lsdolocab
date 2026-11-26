<?php

namespace App\Models;

use App\Models\Order;
use App\Models\StockLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'birth_date', 'age', 'address', 'cellphone_number', 'latitude', 'longitude', 'img', 'phone', 'billing_name', 'billing_address', 'billing_city', 'billing_postal_code', 'billing_country', 'payment_method', 'payment_reference'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['avatar_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function hasCompletedProfile(): bool
    {
        return filled($this->birth_date)
            && filled($this->address)
            && filled($this->cellphone_number);
    }

    public function isCustomer(): bool
    {
        return $this->hasRole('Customer');
    }

    public function hasBillingInformation(): bool
    {
        return filled($this->billing_name)
            && filled($this->billing_address)
            && filled($this->billing_city)
            && filled($this->billing_country)
            && filled($this->payment_method);
    }

    public function getAvatarUrlAttribute(): ?string
    {
        $avatar = $this->img;

        if (empty($avatar)) {
            return null;
        }

        // External links (http(s)://) are returned as-is; local storage
        // paths are resolved through the public disk, returning null when
        // the file is missing so broken image icons never render.
        if (str_starts_with($avatar, 'http://') || str_starts_with($avatar, 'https://')) {
            return $avatar;
        }

        return Storage::disk('public')->exists($avatar)
            ? Storage::disk('public')->url($avatar)
            : null;
    }

    public function toCustomerProfile(): array
    {
        $rawAddress = $this->billing_address ?: $this->address;
        $address = $rawAddress;
        $city = $this->billing_city;
        $country = $this->billing_country ?: 'Philippines';

        if (is_string($rawAddress) && is_array($parsed = json_decode($rawAddress, true))
            && isset($parsed['street'], $parsed['barangay'])) {
            $street = (string) ($parsed['street'] ?? '');
            $barangay = (string) ($parsed['barangay'] ?? '');
            $parts = array_filter([$street, $barangay], fn ($part) => $part !== '');
            if ($parts !== []) {
                $address = implode(', ', $parts);
            } else {
                // Fall back to the full formatted address when street and barangay are both empty.
                $address = implode(', ', array_filter([
                    $parsed['street'] ?? '',
                    $parsed['barangay'] ?? '',
                    $parsed['city'] ?? '',
                    $parsed['province'] ?? '',
                    $parsed['region'] ?? '',
                    $parsed['country'] ?? '',
                ], fn ($part) => $part !== ''));
            }
            $city = $this->billing_city ?: ($parsed['city'] ?? null);
            $country = $this->billing_country ?: ($parsed['country'] ?? 'Philippines');
        }

        return [
            'name' => $this->billing_name ?: $this->name,
            'email' => $this->email,
            'phone' => $this->cellphone_number ?: $this->phone,
            'address' => $address,
            'city' => $city,
            'postal_code' => $this->billing_postal_code
                ?: ($city ? \App\Services\PhilippineZipCodeService::lookup($city) : null),
            'country' => $country,
            'payment_method' => in_array($this->payment_method, ['gcash', 'cod', 'counter'], true)
                ? $this->payment_method
                : 'gcash',
            'payment_reference' => $this->payment_reference,
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function stockLogs(): HasMany
    {
        return $this->hasMany(StockLog::class);
    }

    public static function paginated(array $filters = []): LengthAwarePaginator
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $role = trim((string) ($filters['role'] ?? ''));

        return static::query()
            // The list never needs the base64 `img` blob or billing/payment columns.
            ->select(['id', 'name', 'email', 'age', 'address', 'created_at', 'updated_at'])
            ->selectRaw('(img IS NOT NULL) AS has_img')
            ->withCasts(['has_img' => 'boolean'])
            ->with('roles:id,name')
            ->when($search !== '', function ($query) use ($search) {
                $term = '%'.addcslashes($search, '\\%_').'%';

                $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('email', 'like', $term));
            })
            ->when($role !== '', fn ($query) => $query->whereHas('roles', fn ($q) => is_numeric($role)
                ? $q->where('roles.id', (int) $role)
                : $q->where('roles.name', $role)))
            ->latest()
            ->latest('id')
            ->paginate(10)
            ->withQueryString();
    }

    public static function staffs(): \Illuminate\Database\Eloquent\Collection
    {
        return static::query()
            ->whereHas('roles', fn ($query) => $query->where('name', 'Staff'))
            ->orderBy('name')
            ->get(['id', 'name', 'email']);
    }

    public static function formOptions(): array
    {
        return static::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $user) => [
                'value' => $user->id,
                'label' => $user->name,
            ])
            ->all();
    }
}