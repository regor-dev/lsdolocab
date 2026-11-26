<?php

namespace App\Http\Controllers;

use App\Models\OrderLog;
use App\Services\CrudResourceService;
use App\Services\OrderLogService;
use Illuminate\Database\Eloquent\Model;

class OrderLogController extends CrudResourceController
{
    public function __construct(
        CrudResourceService $resourceService,
        private OrderLogService $orderLogService,
    ) {
        parent::__construct($resourceService);
    }

    protected function modelClass(): string
    {
        return OrderLog::class;
    }

    protected function resourceKey(): string
    {
        return 'orderlog';
    }

    protected function resourceTitle(): string
    {
        return 'Order logs';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'order_item_id', 'column' => 'orderItem.order.order_number', 'label' => 'Order item', 'type' => 'select', 'required' => true],
            ['name' => 'stock_movement_id', 'column' => 'stockMovement.product.name', 'label' => 'Stock movement', 'type' => 'select', 'required' => true],
        ];
    }

    protected function columns(): array
    {
        return [
            ['name' => 'orderItem.order.order_number', 'label' => 'Order'],
            ['name' => 'orderItem.product.name', 'label' => 'Ordered product'],
            ['name' => 'stockMovement.product.name', 'label' => 'Stock product'],
            ['name' => 'created_at', 'label' => 'Created'],
        ];
    }

    protected function relations(): array
    {
        return [
            'orderItem.order:id,order_number',
            'orderItem.product:id,name',
            'stockMovement.product:id,name',
        ];
    }

    protected function options(): array
    {
        return $this->orderLogService->getFormOptions();
    }

    protected function validationRules(?Model $record): array
    {
        return [
            'order_item_id' => ['required', 'integer', 'exists:order_items,id'],
            'stock_movement_id' => ['required', 'integer', $this->orderLogService->stockMovementRuleForOrderItem(request()->input('order_item_id'))],
        ];
    }
}
