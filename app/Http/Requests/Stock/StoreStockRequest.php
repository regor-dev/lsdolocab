<?php

namespace App\Http\Requests\Stock;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class StoreStockRequest extends FormRequest
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
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'status' => ['required', 'string', Rule::in(['in_stock', 'low_stock', 'out_of_stock'])],
            'quantity'   => ['required', 'integer', 'min:0'],
        ];
    }
}
