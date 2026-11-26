<?php

namespace App\Dtos;

/**
 * Immutable snapshot of the admin dashboard. Only scalars/arrays are stored so
 * it can be cached safely with any cache driver.
 */
final readonly class AdminDashboardData
{
    /**
     * @param  array{products: int, categories: int, orders: int, customers: int}  $overview
     * @param  array{totalUnits: int, statuses: list<array{status: string, products: int, units: int}>, lowStock: list<array<string, mixed>>}  $inventory
     * @param  list<array<string, mixed>>  $recentOrders
     * @param  list<array{id: int, name: string, email: string}>  $staffs
     */
    public function __construct(
        public array $overview,
        public array $inventory,
        public array $recentOrders,
        public array $staffs,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self($data['overview'], $data['inventory'], $data['recentOrders'], $data['staffs']);
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return get_object_vars($this);
    }
}
