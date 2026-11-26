<?php

namespace App\Policies;

use App\Models\StockMovement;
use App\Models\User;

class StockMovementPolicy
{
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'Staff']);
    }

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'Staff']);
    }

    public function approve(User $user): bool
    {
        return $user->hasRole('Admin');
    }

    public function reject(User $user): bool
    {
        return $user->hasRole('Admin');
    }

    public function update(User $user): bool
    {
        return $user->hasRole('Admin');
    }

    public function delete(User $user): bool
    {
        return $user->hasRole('Admin');
    }
}
