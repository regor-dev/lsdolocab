<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Services\CrudResourceService;
use App\Services\StockService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends CrudResourceController
{
    public function __construct(
        CrudResourceService $resourceService,
        private StockService $stockService,
    ) {
        parent::__construct($resourceService);
    }

    protected function modelClass(): string
    {
        return Stock::class;
    }

    protected function resourceKey(): string
    {
        return 'stock';
    }

    protected function resourceTitle(): string
    {
        return 'Stock records';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'product_id', 'column' => 'product.name', 'label' => 'Product', 'type' => 'select', 'required' => true],
            ['name' => 'quantity', 'label' => 'Quantity', 'type' => 'number', 'required' => true, 'step' => '1'],
            [
                'name' => 'status',
                'label' => 'Status',
                'type' => 'select',
                'required' => true,
                'options' => [
                    ['value' => 'in_stock', 'label' => 'In stock'],
                    ['value' => 'low_stock', 'label' => 'Low stock'],
                    ['value' => 'out_of_stock', 'label' => 'Out of stock'],
                ],
            ],
        ];
    }

    protected function columns(): array
    {
        return [
            ['name' => 'product.name', 'label' => 'Product'],
            ['name' => 'quantity', 'label' => 'Quantity'],
            ['name' => 'status', 'label' => 'Status'],
        ];
    }

    protected function relations(): array
    {
        return ['product:id,name'];
    }

    protected function options(): array
    {
        return $this->stockService->getProductOptions();
    }

    protected function validationRules(?Model $record): array
    {
        $productRule = Rule::unique('stocks', 'product_id');
        if ($record !== null) {
            $productRule->ignore($record->getKey());
        }

        return [
            'product_id' => ['required', 'integer', 'exists:products,id', $productRule],
            'quantity' => ['required', 'integer', 'min:0', 'max:1000000'],
            'status' => ['required', Rule::in(['in_stock', 'low_stock', 'out_of_stock'])],
        ];
    }

    protected function searchableColumns(): array
    {
        return ['status'];
    }

    public function index(Request $request): Response
    {
        $stocks = Stock::with(['product:id,name'])
            ->latest('updated_at')
            ->paginate(10, ['*'], 'stocks_page');

        $movements = StockMovement::with([
            'product:id,name',
            'movementType:id,movement_status',
            'user:id,name',
            'stockLogs.user:id,name',
        ])
            // Approval queue is Stock-In only: exclude any legacy outbound/negative rows.
            ->where('quantity_change', '>', 0)
            ->whereHas('movementType', fn ($q) => $q->where('movement_status', 'stock in'))
            ->latest()
            ->paginate(10, ['*'], 'movements_page');

        $products = Product::orderBy('name')->get(['id', 'name']);

        $productStocks = Product::with(['brand:id,brand_name', 'variant:id,color,size,sku,price', 'stocks:id,product_id,quantity,status'])
            ->select(['id', 'brand_id', 'product_var_id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'brand_name' => $product->brand?->brand_name ?? 'Unbranded',
                'size' => $product->variant?->size ?? 'N/A',
                'color' => $product->variant?->color ?? 'N/A',
                'sku' => $product->variant?->sku ?? 'N/A',
                'price' => $product->variant?->price ?? 0,
                'quantity' => (int) ($product->stocks?->first()?->quantity ?? 0),
                'status' => $product->stocks?->first()?->status ?? 'out_of_stock',
            ]);

        return Inertia::render('stocks/index', [
            'stocks'       => $stocks,
            'movements'    => $movements,
            'products'     => $products,
            'productStocks' => $productStocks,
            'isStaff'      => $request->user()?->hasRole('Staff') && ! $request->user()?->hasRole('Admin'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity'   => ['required', 'integer', 'min:0'],
        ]);

        $qty = (int) $validated['quantity'];
        $status = $qty <= 0 ? 'out_of_stock' : ($qty <= 10 ? 'low_stock' : 'in_stock');

        $payload = ['quantity' => $qty];
        if (Schema::hasColumn('stocks', 'status')) {
            $payload['status'] = $status;
        }

        Stock::updateOrCreate(
            ['product_id' => $validated['product_id']],
            $payload
        );

        return back()->with('success', 'Stock record saved.');
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:0'],
        ]);

        $qty = (int) $validated['quantity'];
        $status = $qty <= 0 ? 'out_of_stock' : ($qty <= 10 ? 'low_stock' : 'in_stock');

        $payload = ['quantity' => $qty];
        if (Schema::hasColumn('stocks', 'status')) {
            $payload['status'] = $status;
        }

        $stock = Stock::findOrFail($id);
        $stock->update($payload);

        return back()->with('success', 'Stock record updated.');
    }

    public function destroy(string $id): RedirectResponse
    {
        $stock = Stock::findOrFail($id);
        $stock->delete();

        return back()->with('success', 'Stock record deleted.');
    }
}
