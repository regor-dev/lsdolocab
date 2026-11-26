<?php
namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'brand_id'       => ['required', 'integer', 'exists:brands,id'],
            'product_var_id' => ['required', 'integer', 'exists:product_variants,id'],
            'name'           => ['required', 'string', 'max:255'],
            'description'    => ['nullable', 'string', 'max:5000'],
            'image'          => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            'remove_image'   => ['sometimes', 'boolean'],
            'size_stocks'    => ['nullable', 'array'],
            'size_stocks.*'  => ['integer', 'min:0'],
        ];
    }
}