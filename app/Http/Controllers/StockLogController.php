<?php

namespace App\Http\Controllers;

use App\Models\StockLog;
use App\Services\CrudResourceService;
use App\Services\StockLogService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

class StockLogController extends CrudResourceController
{
    public function __construct(
        CrudResourceService $resourceService,
        private StockLogService $stockLogService,
    ) {
        parent::__construct($resourceService);
    }

    protected function modelClass(): string
    {
        return StockLog::class;
    }

    protected function resourceKey(): string
    {
        return 'stocklog';
    }

    protected function resourceTitle(): string
    {
        return 'Stock logs';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'user_id', 'column' => 'user.name', 'label' => 'User', 'type' => 'select', 'required' => true],
            ['name' => 'stock_movement_id', 'column' => 'stockMovement.product.name', 'label' => 'Stock movement', 'type' => 'select', 'required' => true],
            [
                'name' => 'status',
                'label' => 'Status',
                'type' => 'select',
                'required' => true,
                'options' => [
                    ['value' => 'pending', 'label' => 'Pending'],
                    ['value' => 'approved', 'label' => 'Approved'],
                    ['value' => 'rejected', 'label' => 'Rejected'],
                ],
            ],
        ];
    }

    protected function columns(): array
    {
        return [
            ['name' => 'user.name', 'label' => 'User'],
            ['name' => 'stockMovement.product.name', 'label' => 'Product'],
            ['name' => 'status', 'label' => 'Status'],
            ['name' => 'created_at', 'label' => 'Created'],
        ];
    }

    protected function relations(): array
    {
        return ['user:id,name', 'stockMovement.product:id,name'];
    }

    protected function options(): array
    {
        return $this->stockLogService->getFormOptions();
    }

    protected function validationRules(?Model $record): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'stock_movement_id' => ['required', 'integer', 'exists:stock_movements,id'],
            'status' => ['required', Rule::in(['pending', 'approved', 'rejected'])],
        ];
    }
}
