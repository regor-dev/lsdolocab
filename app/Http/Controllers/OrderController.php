<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderLog;
use App\Actions\UpdateOrderStatusAction;
use App\Dtos\UpdateOrderStatusData;
use App\Http\Requests\Order\UpdateOrderStatusRequest;
use App\Services\CheckoutService;
use App\Services\CrudResourceService;
use App\Services\OrderService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\Rule;

class OrderController extends CrudResourceController
{
    public function __construct(
        CrudResourceService $resourceService,
        private OrderService $orderService,
        private CheckoutService $checkoutService,
        private UpdateOrderStatusAction $updateOrderStatusAction,
    ) {
        parent::__construct($resourceService);
    }

    protected function modelClass(): string
    {
        return Order::class;
    }

    protected function relations(): array
    {
        return ['orderItems', 'orderLogs', 'user'];
    }

    protected function resourceKey(): string
    {
        return 'order';
    }

    protected function resourceTitle(): string
    {
        return 'Orders';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'order_number', 'label' => 'Order number', 'type' => 'text', 'required' => true],
            ['name' => 'customer_name', 'label' => 'Customer name', 'type' => 'text', 'required' => true],
            ['name' => 'customer_email', 'label' => 'Customer email', 'type' => 'text'],
            ['name' => 'customer_phone', 'label' => 'Customer phone', 'type' => 'text'],
            ['name' => 'order_date', 'label' => 'Order date', 'type' => 'date', 'required' => true],
            [
                'name' => 'status',
                'label' => 'Status',
                'type' => 'select',
                'required' => true,
                'options' => [
                    ['value' => 'pending', 'label' => 'Pending'],
                    ['value' => 'processing', 'label' => 'Processing'],
                    ['value' => 'completed', 'label' => 'Completed'],
                    ['value' => 'cancelled', 'label' => 'Cancelled'],
                ],
            ],
            ['name' => 'billing_name', 'label' => 'Billing name', 'type' => 'text'],
            ['name' => 'billing_address', 'label' => 'Billing address', 'type' => 'textarea'],
            ['name' => 'billing_city', 'label' => 'Billing city', 'type' => 'text'],
            ['name' => 'billing_postal_code', 'label' => 'Postal code', 'type' => 'text'],
            ['name' => 'billing_country', 'label' => 'Country', 'type' => 'text'],
            ['name' => 'payment_method', 'label' => 'Payment method', 'type' => 'text'],
            ['name' => 'payment_reference', 'label' => 'Payment reference', 'type' => 'text'],
        ];
    }

    protected function columns(): array
    {
        return [
            ['name' => 'order_number', 'label' => 'Order number'],
            ['name' => 'customer_name', 'label' => 'Customer'],
            ['name' => 'customer_email', 'label' => 'Email'],
            ['name' => 'order_date', 'label' => 'Order date'],
            ['name' => 'status', 'label' => 'Status'],
            ['name' => 'payment_method', 'label' => 'Payment'],
            ['name' => 'total', 'label' => 'Total'],
        ];
    }

    protected function validationRules(?Model $record): array
    {
        $uniqueOrderNumber = Rule::unique('orders', 'order_number');
        if ($record !== null) {
            $uniqueOrderNumber->ignore($record->getKey());
        }

        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'order_number' => ['required', 'string', 'max:100', $uniqueOrderNumber],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'order_date' => ['required', 'date'],
            'status' => ['required', Rule::in(['pending', 'processing', 'completed', 'cancelled'])],
            'billing_name' => ['nullable', 'string', 'max:255'],
            'billing_address' => ['nullable', 'string', 'max:255'],
            'billing_city' => ['nullable', 'string', 'max:100'],
            'billing_postal_code' => ['nullable', 'string', 'max:30'],
            'billing_country' => ['nullable', 'string', 'max:100'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
        ];
    }

    protected function prepareAttributes(array $data, ?Model $record): array
    {
        return $this->orderService->prepareResourceAttributes(parent::prepareAttributes($data, $record), $record);
    }

    protected function searchableColumns(): array
    {
        return ['order_number', 'customer_name', 'customer_email', 'payment_reference'];
    }

    public function customerHistory(Request $request): Response
    {
        $orders = $this->checkoutService->customerOrderHistory($request->user());

        return Inertia::render('orders/history', [
            'orders' => $orders->through(fn (Order $order) => $this->checkoutService->transformOrder($order))->items(),
            'pagination' => [
                'total' => $orders->total(),
                'count' => $orders->count(),
                'per_page' => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }

    public function cancel(Request $request, Order $order): RedirectResponse
    {
        if ($order->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($order->status !== 'pending') {
            return back()->with('error', 'Only pending orders can be cancelled.');
        }

        $this->orderService->cancelOrder($order);

        return back()->with('success', "Order {$order->order_number} has been cancelled.");
    }

    public function index(Request $request): Response|RedirectResponse
    {
        Gate::authorize('viewAny', Order::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:20'],
        ]);

        $query = Order::with([
            'user:id,name,email',
            'orderItems.product:id,name',
            'orderLogs.user:id,name',
        ])->latest('order_date')
            ->latest('id');

        if ($search = $filters['search'] ?? null) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        $orders = $query->paginate(10)->withQueryString();

        $orderLogs = OrderLog::with([
            'order:id,order_number',
            'orderItem.product:id,name',
            'orderItem.order:id,order_number',
            'stockMovement.product:id,name',
            'user:id,name',
        ])->latest()->take(50)->get();

        return Inertia::render('orders/index', [
            'orders' => $orders,
            'orderLogs' => $orderLogs,
            'filters' => $filters,
        ]);
    }

    public function staffIndex(Request $request): Response
    {
        Gate::authorize('viewAny', Order::class);

        $orders = Order::select([
            'id',
            'user_id',
            'order_number',
            'customer_name',
            'customer_email',
            'customer_phone',
            'order_date',
            'total',
            'status',
        ])
            ->with([
                'user:id,name,email',
                'items:id,order_id,product_id,quantity,sub_total',
                'items.product:id,name',
            ])
            ->withCount('items')
            ->latest('order_date')
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('staff-orders', [
            'orders' => $orders,
        ]);
    }

    public function staffShow(string $id): Response
    {
        $order = $this->findRecord($id);
        Gate::authorize('view', $order);

        return Inertia::render('staff-orders', [
            'order' => $order,
        ]);
    }

    public function show(string $id): Response|RedirectResponse
    {
        $order = $this->findRecord($id);
        Gate::authorize('view', $order);

        return $this->page('show', ['record' => $order]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        Gate::authorize('updateStatus', $order);

        $data = new UpdateOrderStatusData($request->validated('status'));
        $this->updateOrderStatusAction->execute($order, $data);

        return back()->with('success', "Order status updated to {$request->validated('status')}.");
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $order = Order::findOrFail($id);
        Gate::authorize('update', $order);

        $validated = $request->validate([
            'order_number' => ['required', 'string', 'max:255'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'status' => ['required', 'in:pending,processing,completed,cancelled'],
        ]);

        $previousStatus = strtolower((string) $order->status);
        $newStatus = strtolower($validated['status']);

        \Illuminate\Support\Facades\DB::transaction(function () use ($order, $validated, $previousStatus, $newStatus, $request) {
            $order->update([
                'order_number' => $validated['order_number'],
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? $order->customer_email,
                'status' => $newStatus,
            ]);

            if ($previousStatus !== $newStatus) {
                $firstItem = $order->orderItems()->first();
                $latestStockMovementId = $firstItem
                    ? \App\Models\StockMovement::where('product_id', $firstItem->product_id)->latest('id')->value('id')
                    : null;

                \App\Models\OrderLog::create([
                    'order_id' => $order->id,
                    'order_item_id' => $firstItem?->id,
                    'stock_movement_id' => $latestStockMovementId,
                    'user_id' => $request->user()?->id,
                    'action' => "Status changed from {$previousStatus} to {$newStatus}",
                ]);
            }
        });

        return back()->with('success', 'Order updated successfully.');
    }

    public function destroy(string $id): RedirectResponse
    {
        $order = $this->findRecord($id);
        Gate::authorize('delete', $order);

        return parent::destroy($id);
    }
}
