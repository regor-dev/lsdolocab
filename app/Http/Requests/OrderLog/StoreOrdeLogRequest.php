<?php

namespace App\Http\Requests\OrderLog;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreOrdeLogRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'order_item_id'     => ['required', 'integer', 'exists:order_items,id'],
            'stock_movement_id' => ['required', 'integer', 'exists:stock_movements,id'],
        ];
    }
}
