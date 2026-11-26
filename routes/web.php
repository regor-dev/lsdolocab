<?php



use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Auth\ProfileCompletionController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderLogController;
use App\Http\Controllers\StockLogController;
use App\Http\Controllers\OrderItemController;
use App\Http\Controllers\MovementTypeController;
use App\Http\Controllers\SizeCategoryController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\ProductVariantController;
use App\Services\Location\PhilippineLocationService;



Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('profile/complete', [ProfileCompletionController::class, 'edit'])->name('profile.complete');
    Route::match(['GET', 'POST'], 'profile/complete/preview', [ProfileCompletionController::class, 'preview'])->name('profile.complete.preview');
    Route::match(['POST', 'PATCH'], 'profile/complete', [ProfileCompletionController::class, 'update'])
        ->middleware(['role:Customer'])
        ->name('profile.complete.update');
    Route::post('checkout', CheckoutController::class)
        ->middleware(['role:Customer', 'profile.complete', 'throttle:120,1'])
        ->name('checkout.store');

    Route::get('checkout', [CheckoutController::class, 'show'])
        ->middleware(['role:Customer', 'profile.complete'])
        ->name('checkout');

    Route::get('checkout/success', [CheckoutController::class, 'success'])
        ->middleware(['role:Customer', 'profile.complete'])
        ->name('checkout.success');

    Route::get('dashboard', DashboardController::class)
        ->middleware(['profile.complete'])
        ->name('dashboard');

    Route::middleware(['role:Customer'])->group(function () {
        Route::get('shop', [ProductController::class, 'shop'])->name('shop');
        Route::get('orders', [OrderController::class, 'customerHistory'])->name('orders.history');
        Route::delete('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    });

    Route::middleware(['role:Admin|Staff', 'profile.complete'])->group(function () {
        Route::get('/staff-orders', [OrderController::class, 'staffIndex'])->name('staff-orders.index');
        Route::get('/staff-orders/{order}', [OrderController::class, 'staffShow'])->name('staff-orders.show');
        Route::patch('/staff-orders/{order}/status', [OrderController::class, 'updateStatus'])->name('staff-orders.status');
        Route::get('/stock-movements', fn () => redirect()->to('/stocks'))->name('stock-movements.index');
        Route::get('/stocks', [StockController::class, 'index'])->name('stocks.index');
        Route::post('/stocks', [StockController::class, 'store'])->name('stocks.store');
        Route::put('/stocks/{stock}', [StockController::class, 'update'])->name('stocks.update');
        Route::delete('/stocks/{stock}', [StockController::class, 'destroy'])->name('stocks.destroy');
        Route::get('/stocklog', fn () => redirect()->to('/stocks'));
        Route::post('/stock-movements', [StockMovementController::class, 'store'])->name('stock-movements.store');
        });

    Route::middleware(['auth', 'role:Admin', 'profile.complete'])->prefix('admin')->group(function () {
        Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
        Route::resource('order', OrderController::class)->except(['index', 'show']);
        Route::get('/orderlog', fn (\Illuminate\Http\Request $request) => redirect()->route('orders.index'))->name('orderlog.redirect');
        Route::resource('orderlog', OrderLogController::class);

        // Plural redirects for sidebar/navigation consistency
        Route::get('/products', fn () => redirect()->route('product.index'));
        Route::get('/brands', fn () => redirect()->route('brand.index'));
        Route::get('/users', fn () => redirect()->route('user.index'));
        Route::get('/roles', fn () => redirect()->route('role.index'));
        Route::get('/sizecategories', fn () => redirect()->route('sizecategory.index'));
        Route::get('/productvariants', fn () => redirect()->route('productvariant.index'));

        Route::get('user/{user}/avatar', [UserController::class, 'avatar'])->name('user.avatar');
        Route::get('brand/{brand}/image', [BrandController::class, 'showImage'])->name('brand.image');
        Route::get('product/{product}/image', [ProductController::class, 'showImage'])->name('product.image');
        Route::get('productvariant/options', [ProductVariantController::class, 'variantOptions'])->name('productvariant.options');
        Route::resource('user', UserController::class);
        Route::resource('brand', BrandController::class);
        Route::resource('role', RoleController::class);
        Route::resource('sizecategory', SizeCategoryController::class);
        Route::resource('product', ProductController::class);
        Route::resource('productvariant', ProductVariantController::class);
        Route::resource('stock', StockController::class);
        Route::resource('movementtype', MovementTypeController::class);
        Route::resource('stockmovement', StockMovementController::class)->except(['store']);
        Route::resource('stocklog', StockLogController::class);
        Route::patch('/stockmovement/{stockmovement}/approve', [StockMovementController::class, 'approve'])->name('stockmovement.approve');
        Route::patch('/stockmovement/{stockmovement}/reject', [StockMovementController::class, 'reject'])->name('stockmovement.reject');
    });

    Route::middleware(['auth'])->prefix('api/locations')->name('api.locations.')->group(function () {
        Route::get('/provinces', function () {
            return app(PhilippineLocationService::class)->getProvinces();
        })->name('provinces');

        Route::get('/provinces/{code}/cities', function (string $code) {
            return app(PhilippineLocationService::class)->getCitiesByProvince($code);
        })->name('cities');

        Route::get('/cities/{code}/barangays', function (string $code) {
            return app(PhilippineLocationService::class)->getBarangaysByCity($code);
        })->name('barangays');

        Route::get('/geocode', function (Request $request) {
            $request->validate(['q' => 'string|max:255']);

            return app(PhilippineLocationService::class)
                ->forwardGeocode($request->string('q', ''));
        })->name('geocode');

        Route::get('/reverse', function (Request $request) {
            $request->validate([
                'lat' => 'required|numeric|between:9.02,11.05',
                'lon' => 'required|numeric|between:122.35,123.58',
            ]);

            return app(PhilippineLocationService::class)->reverseGeocode(
                (float) $request->validated('lat'),
                (float) $request->validated('lon')
            );
        })->name('reverse');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
