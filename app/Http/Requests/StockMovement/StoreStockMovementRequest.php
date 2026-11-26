<?php

namespace App\Http\Requests\StockMovement;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreStockMovementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['Admin', 'Staff']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'product_id'      => ['required', 'integer', 'exists:products,id'],
            'movement_id'     => ['required', 'integer', 'exists:movement_types,id'],
            'quantity_change' => ['required', 'integer', 'min:1', 'max:1000000'],
        ];
    }
}
