<?php

namespace App\Http\Controllers;

use App\Services\CrudResourceService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

abstract class CrudResourceController extends Controller
{
    public function __construct(protected CrudResourceService $resourceService) {}

    abstract protected function modelClass(): string;

    abstract protected function resourceKey(): string;

    abstract protected function resourceTitle(): string;

    abstract protected function fields(): array;

    abstract protected function validationRules(?Model $record): array;

    protected function hiddenUiRedirect(): ?string
    {
        return null;
    }

    protected function columns(): array
    {
        return array_map(
            fn (array $field) => ['name' => $field['column'] ?? $field['name'], 'label' => $field['label']],
            $this->fields()
        );
    }

    protected function relations(): array
    {
        return [];
    }

    protected function searchableColumns(): array
    {
        return [];
    }

    protected function options(): array
    {
        return [];
    }

    protected function afterSave(Model $record, ?Model $previous): void {}

    protected function beforeDelete(Model $record): void {}

    protected function afterDelete(Model $record): void {}

    public function index(Request $request): Response|RedirectResponse
    {
        if ($redirect = $this->hiddenUiRedirect()) {
            return redirect($redirect);
        }

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $records = $this->resourceService->paginate(
            $this->modelClass(),
            $this->relations(),
            $this->searchableColumns(),
            $filters['search'] ?? null,
        );

        return $this->page('index', [
            'records' => $records,
            'filters' => $filters,
        ]);
    }

    public function create(): Response|RedirectResponse
    {
        if ($redirect = $this->hiddenUiRedirect()) {
            return redirect($redirect);
        }

        return $this->page('create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request, null);

        $this->resourceService->create(
            $this->modelClass(),
            $this->prepareAttributes($data, null),
            fn (Model $record) => $this->afterSave($record, null),
        );

        return redirect('/'.$this->resourceKey())->with('success', $this->resourceTitle().' created successfully.');
    }

    public function show(string $id): Response|RedirectResponse
    {
        if ($redirect = $this->hiddenUiRedirect()) {
            return redirect($redirect);
        }

        return $this->page('show', ['record' => $this->findRecord($id)]);
    }

    public function edit(string $id): Response|RedirectResponse
    {
        if ($redirect = $this->hiddenUiRedirect()) {
            return redirect($redirect);
        }

        return $this->page('edit', ['record' => $this->findRecord($id)]);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $record = $this->findRecord($id);
        $data = $this->validatedData($request, $record);

        $this->resourceService->update(
            $record,
            $this->prepareAttributes($data, $record),
            fn (Model $record, ?Model $previous) => $this->afterSave($record, $previous),
        );

        return redirect('/'.$this->resourceKey())->with('success', $this->resourceTitle().' updated successfully.');
    }

    public function destroy(string $id): RedirectResponse
    {
        $this->resourceService->delete(
            $this->modelClass(),
            $id,
            $this->relations(),
            fn (Model $record) => $this->beforeDelete($record),
            fn (Model $record) => $this->afterDelete($record),
        );

        return redirect('/'.$this->resourceKey())->with('success', $this->resourceTitle().' deleted successfully.');
    }

    protected function findRecord(string $id): Model
    {
        return $this->resourceService->find($this->modelClass(), $id, $this->relations());
    }

    protected function prepareAttributes(array $data, ?Model $record): array
    {
        return $this->resourceService->prepareAttributes($data, $this->fields());
    }

    private function validatedData(Request $request, ?Model $record): array
    {
        $request->merge($this->resourceService->normalizeInput($request->all(), $this->fields()));

        return $request->validate($this->validationRules($record));
    }

    private function page(string $mode, array $data = []): Response
    {
        $options = $this->options();

        return Inertia::render('resource-manager', array_merge([
            'mode' => $mode,
            'resource' => [
                'key' => $this->resourceKey(),
                'title' => $this->resourceTitle(),
                'fields' => array_map(
                    fn (array $field) => array_merge($field, ['options' => $options[$field['name']] ?? ($field['options'] ?? [])]),
                    $this->fields()
                ),
                'columns' => $this->columns(),
            ],
        ], $data));
    }
}
