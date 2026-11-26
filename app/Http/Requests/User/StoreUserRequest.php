<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function prepareForValidation(): void
    {
        $data = $this->all();

        foreach (['name', 'email', 'address'] as $field) {
            if (array_key_exists($field, $data) && is_string($data[$field])) {
                $value = $data[$field];

                if ($field === 'name' || $field === 'address') {
                    $this->merge([$field => trim(strip_tags($value))]);
                    continue;
                }

                if ($field === 'email') {
                    $this->merge([$field => strtolower(trim($value))]);
                }
            }
        }

    }

    public function rules(): array
    {
        return [
            'name'                  => 'required|string|max:50',
            'email'                 => 'required|string|email|max:255|unique:users,email',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string|min:8',
            'birth_date'            => ['nullable', 'date', 'before:today', 'after_or_equal:'.today()->subYears(100)->toDateString()],
            'address'               => 'nullable|string',
            'latitude'              => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'             => ['nullable', 'numeric', 'between:-180,180'],
            'role_id'               => 'required|exists:roles,id',
            'image'                 => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120', 'dimensions:max_width=4096,max_height=4096'],
        ];
    }
}