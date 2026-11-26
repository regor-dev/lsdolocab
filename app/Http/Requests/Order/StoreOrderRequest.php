<?php

namespace App\Http\Requests\Order;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function prepareForValidation(): void
    {
        foreach (['customer_name', 'order_number'] as $field) {
            $value = $this->input($field);
            if (is_string($value)) {
                $this->merge([$field => trim(strip_tags($value))]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_name'      => ['required', 'string', 'max:255'],
            'order_number'       => ['required', 'string', 'max:100', 'unique:orders,order_number'],
            'order_date'         => ['required', 'date'],
            'status'             => ['required', 'string', Rule::in(['pending', 'processing', 'completed'])],
        ];
    }
}
