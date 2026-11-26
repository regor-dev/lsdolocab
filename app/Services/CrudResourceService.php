<?php

namespace App\Services;

use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CrudResourceService
{
    /**
     * @param  class-string<Model>  $modelClass
     * @param  array<string>  $relations
     * @param  array<string>  $searchableColumns
     */
    public function paginate(string $modelClass, array $relations, array $searchableColumns, ?string $search): LengthAwarePaginator
    {
        return $modelClass::query()
            ->with($relations)
            ->when($search && $searchableColumns !== [], function (Builder $query) use ($search, $searchableColumns): void {
                $query->where(function (Builder $query) use ($search, $searchableColumns): void {
                    foreach ($searchableColumns as $column) {
                        $query->orWhere($column, 'like', '%'.$search.'%');
                    }
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @param  class-string<Model>  $modelClass
     * @param  array<string>  $relations
     */
    public function find(string $modelClass, int|string $id, array $relations): Model
    {
        return $modelClass::query()
            ->with($relations)
            ->findOrFail($id);
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    public function create(string $modelClass, array $attributes, ?Closure $afterSave = null): Model
    {
        return DB::transaction(function () use ($modelClass, $attributes, $afterSave): Model {
            $record = $modelClass::query()->create($attributes);
            $afterSave?->__invoke($record, null);

            return $record;
        });
    }

    public function update(Model $record, array $attributes, ?Closure $afterSave = null): bool
    {
        return DB::transaction(function () use ($record, $attributes, $afterSave): bool {
            $previous = clone $record;
            $updated = $record->update($attributes);
            $afterSave?->__invoke($record, $previous);

            return $updated;
        });
    }

    /**
     * @param  class-string<Model>  $modelClass
     * @param  array<string>  $relations
     */
    public function delete(
        string $modelClass,
        int|string $id,
        array $relations,
        ?Closure $beforeDelete = null,
        ?Closure $afterDelete = null,
    ): bool {
        return DB::transaction(function () use ($modelClass, $id, $relations, $beforeDelete, $afterDelete): bool {
            $record = $this->find($modelClass, $id, $relations);
            $beforeDelete?->__invoke($record);
            $deleted = $record->delete();
            $afterDelete?->__invoke($record);

            return $deleted;
        });
    }

    /**
     * @param  array<array{name: string}>  $fields
     */
    public function normalizeInput(array $data, array $fields): array
    {
        foreach (array_column($fields, 'name') as $field) {
            if (isset($data[$field]) && is_string($data[$field])) {
                $data[$field] = $this->sanitizeString($data[$field]);
            }
        }

        return $data;
    }

    /**
     * @param  array<array{name: string}>  $fields
     */
    public function prepareAttributes(array $data, array $fields): array
    {
        $allowed = array_column($fields, 'name');
        $attributes = array_intersect_key($data, array_flip($allowed));

        foreach ($attributes as $key => $value) {
            if (is_string($value)) {
                $attributes[$key] = $this->sanitizeString($value);
            }
        }

        return $attributes;
    }

    private function sanitizeString(string $value): string
    {
        return trim(strip_tags($value));
    }

    /**
     * @param  class-string<Model>|Builder  $source
     * @param  array{0: string, 1: string}|string  $columns
     * @param  string|Closure  $label
     * @param  string|null  $orderBy
     * @param  string  $orderDir
     * @return array<int, array{value: mixed, label: string}>
     */
    public static function buildOptions(
        Builder|string $source,
        array|string $columns = ['id'],
        string|Closure $label = 'name',
        ?string $orderBy = null,
        string $orderDir = 'asc'
    ): array {
        $query = is_string($source) ? $source::query() : $source;

        if ($orderBy !== null) {
            $query->orderBy($orderBy, $orderDir);
        }

        return $query->get(is_array($columns) ? $columns : [$columns])->map(fn ($item) => [
            'value' => $item->id,
            'label' => $label instanceof Closure ? $label($item) : $item->{$label},
        ])->all();
    }
}
