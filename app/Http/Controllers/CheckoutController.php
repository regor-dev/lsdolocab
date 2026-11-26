<?php

namespace App\Http\Controllers;

use App\Http\Requests\Checkout\StoreCheckoutRequest;
use App\Models\Order;
use App\Models\Product;
use App\Services\CheckoutService;
use App\Services\PhilippineZipCodeService;
use App\Services\ProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        private CheckoutService $checkoutService,
        private ProductService $productService
    ) {}

    public function __invoke(StoreCheckoutRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $order = DB::transaction(function () use ($request, $validated): Order {
            $this->reserveSizeStocks($validated['items']);

            return $this->checkoutService->placeOrder($request->user(), $validated);
        });

        return to_route('checkout.success')
            ->with('success', "Order {$order->order_number} has been placed.");
    }

    /**
     * Validate and reserve per-size stock for every checkout item inside the
     * running transaction. size_stocks maps each size (e.g. a US shoe size) to
     * the quantity available for that size, so only the purchased size is
     * decremented and unrelated sizes stay intact.
     */
    private function reserveSizeStocks(array $items): void
    {
        foreach ($items as $item) {
            $product = Product::lockForUpdate()->find((int) $item['product_id']);

            if ($product === null) {
                throw ValidationException::withMessages([
                    'items' => 'A selected shoe is no longer available.',
                ]);
            }

            $size = (string) ($item['size'] ?? '');
            $quantity = (int) $item['quantity'];
            $sizeStocks = is_array($product->size_stocks) ? $product->size_stocks : [];
            $available = (int) ($sizeStocks[$size] ?? 0);

            if ($available < $quantity) {
                throw ValidationException::withMessages([
                    'items' => "{$product->name} has only {$available} pair(s) available in size {$size}.",
                ]);
            }

            $sizeStocks[$size] = $available - $quantity;
            $product->size_stocks = $sizeStocks;
            $product->save();
        }
    }

    public function success(Request $request): Response
    {
        return Inertia::render('checkout/success');
    }

    public function show(Request $request): Response
    {
        $products = $this->productService->getStorefrontProducts();

        $user = $request->user();

        return Inertia::render('checkout/index', [
            'products' => $products,
            'zipCodes' => PhilippineZipCodeService::all(),
            'deliveryAddress' => $user->toCustomerProfile(),
        ]);
    }

    public function buyNow(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        // Single-item checkout session that never touches the cart table, so
        // existing cart items are left untouched and unconflicted.
        $request->session()->put('buy_now', [
            'product_id' => (int) $validated['product_id'],
            'variant_id' => $validated['variant_id'] ? (int) $validated['variant_id'] : null,
            'quantity' => (int) $validated['quantity'],
        ]);

        return to_route('checkout', ['mode' => 'buy_now'])
            ->with('success', 'Item ready for checkout. Review your order and place it.');
    }
}
