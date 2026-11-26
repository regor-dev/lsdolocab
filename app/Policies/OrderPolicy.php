<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    private function isAdmin(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'admin']);
    }

    private function isAdminOrStaff(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'admin', 'Staff', 'staff']);
    }

    public function viewAny(User $user): bool
    {
        return $this->isAdminOrStaff($user);
    }

    public function view(User $user, Order $order): bool
    {
        return $this->isAdminOrStaff($user);
    }

    public function updateStatus(User $user): bool
    {
        return $this->isAdminOrStaff($user);
    }

    public function update(User $user, Order $order): bool
    {
        if (in_array(strtolower((string) $order->status), ['completed', 'cancelled'], true)) {
            return false;
        }

        return $this->isAdmin($user);
    }

    public function delete(User $user, Order $order): bool
    {
        return $this->isAdmin($user);
    }
}
