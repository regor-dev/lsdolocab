<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Services\CrudResourceService;
use App\Services\RoleService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class RoleController extends CrudResourceController
{
    public function __construct(
        CrudResourceService $resourceService,
        private RoleService $roleService,
    ) {
        parent::__construct($resourceService);
    }

    protected function modelClass(): string
    {
        return Role::class;
    }

    protected function resourceKey(): string
    {
        return 'role';
    }

    protected function resourceTitle(): string
    {
        return 'Roles';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'role_name', 'label' => 'Role name', 'type' => 'text', 'required' => true],
            [
                'name' => 'permissions',
                'label' => 'Permissions',
                'type' => 'select',
                'required' => false,
                'multiple' => true,
            ],
        ];
    }

    protected function columns(): array
    {
        return [
            ['name' => 'name', 'label' => 'Role'],
            ['name' => 'permissions_count', 'label' => 'Permissions'],
            ['name' => 'users_count', 'label' => 'Users'],
        ];
    }

    protected function relations(): array
    {
        return ['permissions:id,name'];
    }

    protected function options(): array
    {
        return [
            'permissions' => $this->roleService->permissionOptions(),
        ];
    }

    protected function validationRules(?Model $record): array
    {
        $uniqueName = Rule::unique('roles', 'name');
        if ($record !== null) {
            $uniqueName->ignore($record->getKey());
        }

        return [
            'role_name' => ['required', 'string', 'max:255', $uniqueName],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }

    protected function searchableColumns(): array
    {
        return ['name'];
    }

    protected function prepareAttributes(array $data, ?Model $record): array
    {
        return $this->roleService->prepareResourceAttributes(parent::prepareAttributes($data, $record));
    }

    protected function afterSave(Model $record, ?Model $previous): void
    {
        $permissions = request()->input('permissions', []);
        $this->roleService->syncPermissions($record, is_array($permissions) ? $permissions : []);
    }

    public function index(Request $request): InertiaResponse|RedirectResponse
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:100']]);
        $records = Role::query()
            ->withCount(['permissions', 'users'])
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('resource-manager', [
            'mode' => 'index',
            'resource' => [
                'key' => $this->resourceKey(),
                'title' => $this->resourceTitle(),
                'fields' => $this->fields(),
                'columns' => $this->columns(),
            ],
            'records' => $records,
            'filters' => $filters,
        ]);
    }
}