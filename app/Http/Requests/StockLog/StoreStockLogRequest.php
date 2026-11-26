<?php

namespace App\Http\Requests\StockLog;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\ValidationRule;

class StoreStockLogRequest extends FormRequest
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
            'user_id'           => ['required', 'integer', 'exists:users,id'],
            'stock_movement_id' => ['required', 'integer', 'exists:stock_movements,id'],
            'status' => ['required', 'string', Rule::in(['pending', 'approved', 'rejected'])],
        ];
    }
}
