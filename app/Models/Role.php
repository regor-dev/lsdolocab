<?php

namespace App\Models;

use Database\Factories\RoleFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    /** @use HasFactory<RoleFactory> */
    use HasFactory;

    protected $appends = ['role_name'];

    public function getRoleNameAttribute(): ?string
    {
        return $this->attributes['name'] ?? null;
    }

    public function setRoleNameAttribute(string $roleName): void
    {
        $this->attributes['name'] = $roleName;
    }

    public static function allOrdered(): Collection
    {
        return static::query()->orderBy('name')->get();
    }

    public static function allRoles(): Collection
    {
        return static::query()->select(['id', 'name', 'guard_name'])->get();
    }

    public const ADMIN = 'Admin';
    public const STAFF = 'Staff';
    public const CUSTOMER = 'Customer';
    public const NAMES = ['Admin', 'Staff', 'Customer'];
}
