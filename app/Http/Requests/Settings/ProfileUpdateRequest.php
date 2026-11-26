<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        foreach (['name', 'address', 'phone', 'cellphone_number', 'billing_name', 'billing_address', 'billing_city', 'billing_postal_code', 'billing_country', 'payment_reference'] as $field) {
            $value = $this->input($field);
            if (is_string($value)) {
                $this->merge([$field => trim(strip_tags($value))]);
            }
        }

        if (is_string($this->input('email'))) {
            $this->merge(['email' => strtolower(trim($this->input('email')))]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'first_name' => ['nullable', 'string', 'max:80'],
            'middle_initial' => ['nullable', 'string', 'max:5'],
            'last_name' => ['nullable', 'string', 'max:80'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'cellphone_number' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'billing_name' => ['nullable', 'string', 'max:255'],
            'billing_address' => ['nullable', 'string', 'max:255'],
            'billing_city' => ['nullable', 'string', 'max:100'],
            'billing_postal_code' => ['nullable', 'string', 'max:30'],
            'billing_country' => ['nullable', 'string', 'max:100'],
            'payment_method' => ['nullable', 'string', 'max:50', Rule::in(['gcash', 'cod', 'counter'])],
            'payment_reference' => ['nullable', 'string', 'max:100'],
        ];
    }
}
