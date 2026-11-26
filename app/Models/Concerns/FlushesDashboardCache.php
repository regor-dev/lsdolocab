<?php

namespace App\Models\Concerns;

use App\Services\AdminDashboardService;
use Illuminate\Support\Facades\DB;

/**
 * Add to Product, Order, Stock and SizeCategory so the admin dashboard cache is
 * dropped whenever they change. Flushing waits for the surrounding transaction
 * to commit so a concurrent request can't re-cache pre-commit data.
 */
trait FlushesDashboardCache
{
    protected static function bootFlushesDashboardCache(): void
    {
        $flush = static fn () => DB::afterCommit(
            static fn () => app(AdminDashboardService::class)->flush()
        );

        static::saved($flush);
        static::deleted($flush);
    }
}
