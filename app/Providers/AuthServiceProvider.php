<?php

namespace App\Providers;

use App\Models\Order;
use App\Models\StockMovement;
use App\Policies\OrderPolicy;
use App\Policies\StockMovementPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Order::class => OrderPolicy::class,
        StockMovement::class => StockMovementPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
