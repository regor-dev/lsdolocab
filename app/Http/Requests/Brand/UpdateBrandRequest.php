<?php

namespace App\Http\Requests\Brand;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function prepareForValidation(): void
    {
        if (is_string($this->input('brand_name'))) {
            $this->merge(['brand_name' => trim(strip_tags($this->input('brand_name')))]);
        }
    }

    public function rules(): array
    {
        return [
            'brand_name' => ['required', 'string', 'max:50', Rule::unique('brands', 'brand_name')->ignore($this->route('brand'))],
            'logo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,svg', 'max:2048'],
        ];
    }
}
