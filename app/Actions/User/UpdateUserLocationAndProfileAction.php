<?php

namespace App\Actions\User;

use App\Models\User;
use App\Services\Location\PhilippineLocationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UpdateUserLocationAndProfileAction
{
    public function __construct(
        private PhilippineLocationService $locationService,
    ) {
    }

    public function execute(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $user->name = Str::title(trim((string) ($data['name'] ?? $user->name)));

            $city = $data['city'] ?? $user->city;
            $user->zip_code = $data['zip_code']
                ?? $this->locationService->resolveZipCode((string) $city)
                ?? $user->zip_code;

            $user->birth_date = $data['birth_date'] ?? $user->birth_date;
            $user->phone = $data['phone'] ?? $user->phone;
            $user->province = $data['province'] ?? $user->province;
            $user->city = $data['city'] ?? $user->city;
            $user->barangay = $data['barangay'] ?? $user->barangay;
            $user->street = $data['street'] ?? $user->street;
            $user->latitude = $data['latitude'] ?? $user->latitude;
            $user->longitude = $data['longitude'] ?? $user->longitude;
            $user->profile_completed = true;

            $user->save();

            if (method_exists($user, 'savedAddresses')) {
                $addressLine = implode(', ', array_filter([
                    $user->street,
                    $user->barangay,
                    $user->city,
                    $user->province,
                ]));

                $user->savedAddresses()->updateOrCreate(
                    ['label' => 'Home'],
                    [
                        'address_line' => $addressLine,
                        'latitude' => $user->latitude,
                        'longitude' => $user->longitude,
                        'is_default' => true,
                    ],
                );
            }

            return $user->fresh();
        });
    }
}
