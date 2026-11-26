<?php

namespace App\Http\Requests\ProductVariant;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductVariantRequest extends FormRequest
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
        foreach (['color', 'size', 'sku'] as $field) {
            $value = $this->input($field);
            if (is_string($value)) {
                $this->merge([$field => trim(strip_tags($value))]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:size_categories,id'],
            'color'       => ['required', 'string', 'max:100'],
            'size'        => ['required', 'string', 'max:50'],
            'sku'         => ['required', 'string', 'max:100', 'unique:product_variants,sku'],
            'price'       => ['required', 'numeric', 'min:0', 'regex:/^\d+(\.\d{1,2})?$/'],
        ];
    }
}
