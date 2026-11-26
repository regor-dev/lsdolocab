<?php

namespace App\Http\Controllers;

use App\Models\MovementType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

class MovementTypeController extends CrudResourceController
{
    protected function modelClass(): string
    {
        return MovementType::class;
    }

    protected function resourceKey(): string
    {
        return 'movementtype';
    }

    protected function resourceTitle(): string
    {
        return 'Movement types';
    }

    protected function hiddenUiRedirect(): ?string
    {
        return '/stock';
    }

    protected function fields(): array
    {
        return [[
            'name' => 'movement_status',
            'label' => 'Movement type',
            'type' => 'select',
            'required' => true,
            'options' => [
                ['value' => 'stock in', 'label' => 'Stock in'],
                ['value' => 'stock out', 'label' => 'Stock out'],
            ],
        ]];
    }

    protected function validationRules(?Model $record): array
    {
        return [
            'movement_status' => ['required', Rule::in(['stock in', 'stock out'])],
        ];
    }

    protected function searchableColumns(): array
    {
        return ['movement_status'];
    }
}
