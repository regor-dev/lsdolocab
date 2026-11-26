<?php

namespace Database\Factories;

use App\Models\OrderLog;
use App\Models\OrderItem;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderLog>
 */
class OrderLogFactory extends Factory
{
    protected $model = OrderLog::class;

    public function definition(): array
    {
        return [
            'order_item_id'     => OrderItem::factory(),
            'stock_movement_id' => StockMovement::factory(),
        ];
    }
}
