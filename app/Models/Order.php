<?php

namespace App\Models;

use App\Models\OrderItem;
use App\Models\User;
use App\Models\Concerns\FlushesDashboardCache;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;


#[Fillable([
    'user_id',
    'customer_name',
    'customer_email',
    'customer_phone',
    'order_number',
    'order_date',
    'status',
    'total',
    'billing_name',
    'billing_address',
    'billing_city',
    'billing_postal_code',
    'billing_country',
    'payment_method',
    'payment_reference',
])]
class Order extends Model
{
    /** @use HasFactory<\Database\Factories\OrderFactory> */
    use HasFactory, FlushesDashboardCache;

    protected $casts = [
        'order_date' => 'datetime',
        'total' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function items(): HasMany
    {
        return $this->orderItems();
    }

    public function orderLogs(): HasManyThrough
    {
        return $this->hasManyThrough(OrderLog::class, OrderItem::class);
    }

    public static function orderNumberExists(string $number): bool
    {
        return static::query()->where('order_number', $number)->exists();
    }

    public static function customerHistory(User $customer): \Illuminate\Database\Eloquent\Builder
    {
        return static::query()
            ->where('user_id', $customer->id)
            ->with([
                'orderItems:id,order_id,product_id,quantity,sub_total',
                'orderItems.product:id,brand_id,product_var_id,name,description',
                'orderItems.product.brand:id,brand_name',
                'orderItems.product.variant:id,color,size,price',
            ])
            ->latest('order_date')
            ->latest('id');
    }

    public static function recentOrders(): Collection
    {
        return static::query()
            ->with('user:id,name')
            ->latest('order_date')
            ->latest('id')
            ->limit(5)
            ->get(['id', 'user_id', 'order_number', 'customer_name', 'status', 'total', 'order_date']);
    }

    public static function formOptions(): array
    {
        return static::query()
            ->latest('order_date')
            ->latest('id')
            ->get(['id', 'order_number'])
            ->map(fn (Order $order) => [
                'value' => $order->id,
                'label' => $order->order_number,
            ])
            ->all();
    }

    public static function recomputeTotal(int $orderId): void
    {
        $total = OrderItem::query()->where('order_id', $orderId)->sum('sub_total');

        static::query()->whereKey($orderId)->update(['total' => $total]);
    }
}
