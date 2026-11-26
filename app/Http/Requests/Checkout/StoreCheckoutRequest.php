<?php

namespace App\Http\Requests\Checkout;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000'],
            'items.*.size' => ['required', 'string', 'max:20'],
            'billing' => ['sometimes', 'array'],
            'billing.name' => ['required_with:billing', 'string', 'max:255'],
            'billing.phone' => ['required_with:billing', 'string', 'max:30'],
            'billing.address' => ['required_with:billing', 'string', 'max:255'],
            'billing.city' => ['required_with:billing', 'string', 'max:100'],
            'billing.postal_code' => ['nullable', 'string', 'max:30'],
            'billing.country' => ['required_with:billing', 'string', 'max:100'],
            'payment_method' => ['nullable', 'string', Rule::in(['gcash', 'cod', 'counter'])],
            'payment_reference' => ['nullable', 'string', 'max:100'],
        ];
    }
}
