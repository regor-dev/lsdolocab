<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isCustomer() ?? false;
    }

    protected function prepareForValidation(): void
    {
        foreach (['phone', 'cellphone_number'] as $field) {
            $value = $this->input($field);

            if (! is_string($value) || $value === '') {
                continue;
            }

            $digits = preg_replace('/[\s-]+/', '', $value);

            if (preg_match('/^\+?639\d{9}$/', $digits)) {
                $normalized = '+'.ltrim($digits, '+');
            } elseif (preg_match('/^09\d{9}$/', $digits)) {
                $normalized = '+63'.substr($digits, 1);
            } elseif (preg_match('/^9\d{9}$/', $digits)) {
                $normalized = '+63'.$digits;
            } else {
                $normalized = $digits;
            }

            $this->merge([$field => $normalized]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();

        $birthDateRules = [
            'required',
            'date',
            'after_or_equal:1900-01-01',
            'before_or_equal:'.now()->subYears(18)->toDateString(),
        ];

        $phoneRules = [
            'nullable',
            'string',
            'max:30',
            'regex:/^\+639\d{9}$/',
            Rule::unique('users', 'phone')->ignore($user?->id),
        ];

        return [
            'birth_date' => $birthDateRules,
            'address' => ['required', 'string', 'max:255'],
            /*
             * City must be a Negros Island city/municipality. The list mirrors
             * PhilippineLocationService::NEGROS_ZIP_CODES (every Negros Occidental
             * and Negros Oriental LGU) so non-Negros cities such as Victoria
             * (Tarlac) are rejected. The service resolves cities over HTTP and
             * falls back to an empty list, so the names are listed here
             * statically: validation never depends on an external request and
             * never fails closed.
             */
            'city' => [
                'nullable',
                'string',
                'max:100',
                Rule::in([
                    // Negros Occidental
                    'Bacolod City', 'Bago City', 'Binalbagan', 'Cadiz City',
                    'Calatrava', 'Candoni', 'Cauayan', 'Don Salvador Benedicto',
                    'Enrique B. Magalona', 'Escalante City', 'Himamaylan City',
                    'Hinigaran', 'Hinoba-an', 'Ilog', 'Isabela',
                    'Kabankalan City', 'La Carlota City', 'La Castellana',
                    'Manapla', 'Moises Padilla', 'Murcia', 'Paraiso',
                    'Pontevedra', 'Pulupandan', 'Sagay City', 'San Carlos City',
                    'San Enrique', 'Silay City', 'Sipalay City', 'Talisay City',
                    'Toboso', 'Valladolid', 'City of Victorias',
                    // Negros Oriental
                    'Amlan', 'Ayungon', 'Bacong', 'Bais City', 'Basay',
                    'Bayawan City', 'Bindoy', 'Canlaon City', 'Dauin',
                    'Dumaguete City', 'Guihulngan City', 'Jimalalud',
                    'La Libertad', 'Mabinay', 'Manjuyod', 'Pamplona',
                    'San Jose', 'Santa Catalina', 'Siaton', 'Sibulan',
                    'Tanjay City', 'Tayasan', 'Valencia', 'Vallehermoso',
                    'Zamboanguita',
                ]),
            ],
            'cellphone_number' => array_merge(['required', 'string', 'max:20'], [
                'regex:/^\+639\d{9}$/',
                Rule::unique('users', 'cellphone_number')->ignore($user?->id),
            ]),
            'phone' => $phoneRules,
            'postal_code' => ['nullable', 'string', 'max:30'],
            'province' => ['nullable', 'string', Rule::in(['Negros Occidental', 'Negros Oriental'])],
            // Province/city/barangay/street/zip_code arrive nested inside the
            // `address` JSON posted by complete-profile.tsx, never as top-level
            // fields, so they cannot be required here. Coordinate bounds cover
            // the Philippines (the map picker still confines pin selection to
            // Negros Island bounds).
            'latitude' => ['required', 'numeric', 'between:4,22'],
            'longitude' => ['required', 'numeric', 'between:115,128'],
        ];
    }

    public function messages(): array
    {
        return [
            'birth_date.before_or_equal' => 'You must be at least 18 years old to register.',
        ];
    }
}
