<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use App\Models\Product;
use App\Models\MovementType;
use App\Actions\CreateStockMovementAction;
use App\Actions\ApproveStockMovementAction;
use App\Actions\RejectStockMovementAction;
use App\Dtos\StockMovementData;
use App\Services\CrudResourceService;
use App\Services\StockMovementService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class StockMovementController extends CrudResourceController
{
    public function __construct(
        CrudResourceService $resourceService,
        private StockMovementService $stockMovementService,
        private CreateStockMovementAction $createStockMovementAction,
        private ApproveStockMovementAction $approveStockMovementAction,
        private RejectStockMovementAction $rejectStockMovementAction,
    ) {
        parent::__construct($resourceService);
    }

    protected function modelClass(): string
    {
        return StockMovement::class;
    }

    protected function resourceKey(): string
    {
        return 'stockmovement';
    }

    protected function resourceTitle(): string
    {
        return 'Stock movements';
    }

    protected function hiddenUiRedirect(): ?string
    {
        return '/stock';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'product_id', 'column' => 'product.name', 'label' => 'Product', 'type' => 'select', 'required' => true],
            ['name' => 'movement_id', 'column' => 'movementType.movement_status', 'label' => 'Movement type', 'type' => 'select', 'required' => true],
            ['name' => 'quantity_change', 'label' => 'Quantity change', 'type' => 'number', 'required' => true, 'step' => '1', 'min' => '1'],
        ];
    }

    protected function columns(): array
    {
        return [
            ['name' => 'product.name', 'label' => 'Product'],
            ['name' => 'movementType.movement_status', 'label' => 'Movement type'],
            ['name' => 'quantity_change', 'label' => 'Quantity change'],
        ];
    }

    protected function relations(): array
    {
        return ['product:id,name', 'movementType:id,movement_status'];
    }

    protected function options(): array
    {
        return $this->stockMovementService->getFormOptions();
    }

    protected function validationRules(?Model $record): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'movement_id' => ['required', 'integer', 'exists:movement_types,id'],
            'quantity_change' => ['required', 'integer', 'min:1', 'max:1000000'],
        ];
    }

    protected function afterSave(Model $record, ?Model $previous): void
    {
        $this->stockMovementService->afterSave($record, $previous);
    }

    protected function beforeDelete(Model $record): void
    {
        $this->stockMovementService->beforeDelete($record);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', StockMovement::class);

        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity_change' => ['required', 'integer', 'min:1', 'max:1000000'],
        ]);

        // Force every submission to Stock In (inbound). Clients cannot submit Stock Out.
        $stockInType = MovementType::where('movement_status', 'stock in')->firstOrFail();

        $autoApprove = auth()->user()->hasRole('Admin');
        $data = new StockMovementData(
            (int) $validated['product_id'],
            (int) $stockInType->id,
            (int) $validated['quantity_change'],
        );

        $this->createStockMovementAction->execute($data, auth()->user(), $autoApprove);

        return back()->with('success', $autoApprove
            ? 'Stock-In created and approved.'
            : 'Stock-In submitted for approval.');
    }

    public function staffIndex(Request $request): Response
    {
        Gate::authorize('viewAny', StockMovement::class);

        $movements = \App\Models\StockMovement::with(['product:id,name', 'movementType:id,movement_status', 'stockLogs.user:id,name'])
            ->latest()
            ->get();

        return Inertia::render('stock-movements', [
            'movements' => $movements,
            'products' => Product::formOptions(),
            'movementTypes' => MovementType::formOptions(),
        ]);
    }

    public function approve(Request $request, string $id): RedirectResponse
    {
        $stockMovement = StockMovement::findOrFail($id);
        Gate::authorize('approve', $stockMovement);

        try {
            $this->approveStockMovementAction->execute($stockMovement, auth()->user());
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Stock movement approved.');
    }

    public function reject(Request $request, string $id): RedirectResponse
    {
        $stockMovement = StockMovement::findOrFail($id);
        Gate::authorize('reject', $stockMovement);

        try {
            $this->rejectStockMovementAction->execute($stockMovement, auth()->user());
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Stock movement rejected.');
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $stockMovement = $this->findRecord($id);
        Gate::authorize('update', $stockMovement);

        return parent::update($request, $id);
    }

    public function destroy(string $id): RedirectResponse
    {
        $stockMovement = $this->findRecord($id);
        Gate::authorize('delete', $stockMovement);

        return parent::destroy($id);
    }
}
