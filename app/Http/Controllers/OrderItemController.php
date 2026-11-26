<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Services\CrudResourceService;
use App\Services\OrderItemService;
use Illuminate\Database\Eloquent\Model;

class OrderItemController extends CrudResourceController
{
    public function __construct(
        CrudResourceService $resourceService,
        private OrderItemService $orderItemService,
    ) {
        parent::__construct($resourceService);
    }

    protected function modelClass(): string
    {
        return OrderItem::class;
    }

    protected function resourceKey(): string
    {
        return 'orderitem';
    }

    protected function resourceTitle(): string
    {
        return 'Order items';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'order_id', 'column' => 'order.order_number', 'label' => 'Order', 'type' => 'select', 'required' => true],
            ['name' => 'product_id', 'column' => 'product.name', 'label' => 'Product', 'type' => 'select', 'required' => true],
            ['name' => 'quantity', 'label' => 'Quantity', 'type' => 'number', 'required' => true, 'step' => '1', 'min' => '1'],
        ];
    }

    protected function columns(): array
    {
        return [
            ['name' => 'order.order_number', 'label' => 'Order'],
            ['name' => 'product.name', 'label' => 'Product'],
            ['name' => 'quantity', 'label' => 'Quantity'],
            ['name' => 'sub_total', 'label' => 'Subtotal'],
        ];
    }

    protected function relations(): array
    {
        return ['order:id,order_number', 'product:id,name'];
    }

    protected function options(): array
    {
        return $this->orderItemService->getFormOptions();
    }

    protected function validationRules(?Model $record): array
    {
        return [
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:100000'],
        ];
    }

    protected function prepareAttributes(array $data, ?Model $record): array
    {
        return $this->orderItemService->prepareResourceAttributes(parent::prepareAttributes($data, $record));
    }

    protected function afterSave(Model $record, ?Model $previous): void
    {
        $this->orderItemService->afterSave($record, $previous);
    }

    protected function afterDelete(Model $record): void
    {
        $this->orderItemService->afterDelete($record);
    }

    protected function searchableColumns(): array
    {
        return [];
    }
}
