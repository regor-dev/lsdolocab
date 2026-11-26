<?php

namespace App\Services;

use App\Models\Role;

class RoleService
{
    public function prepareResourceAttributes(array $attributes): array
    {
        if (array_key_exists('role_name', $attributes)) {
            $attributes['name'] = $attributes['role_name'];
            unset($attributes['role_name']);
        }

        return $attributes;
    }

    /** @return array<int, array{value: int, label: string}> */
    public function permissionOptions(): array
    {
        return \Spatie\Permission\Models\Permission::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($p) => ['value' => $p->id, 'label' => $p->name])
            ->all();
    }

    public function syncPermissions(Role $role, array $permissionNames): void
    {
        $role->syncPermissions($permissionNames);
    }
}
