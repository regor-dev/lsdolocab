<?php

namespace App\Http\Controllers;

use App\Models\SizeCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

class SizeCategoryController extends CrudResourceController
{
    protected function modelClass(): string
    {
        return SizeCategory::class;
    }

    protected function resourceKey(): string
    {
        return 'sizecategory';
    }

    protected function resourceTitle(): string
    {
        return 'Size categories';
    }

    protected function hiddenUiRedirect(): ?string
    {
        return '/product';
    }

    protected function fields(): array
    {
        return [['name' => 'category_name', 'label' => 'Category name', 'type' => 'text', 'required' => true]];
    }

    protected function validationRules(?Model $record): array
    {
        $uniqueName = Rule::unique('size_categories', 'category_name');
        if ($record !== null) {
            $uniqueName->ignore($record->getKey());
        }

        return [
            'category_name' => ['required', 'string', 'max:255', $uniqueName],
        ];
    }

    protected function searchableColumns(): array
    {
        return ['category_name'];
    }
}
