<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ServesStoredImage;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\Product;
use App\Models\Stock;
use App\Services\ProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use ServesStoredImage;

    public function __construct(
        protected ProductService $productService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'brand_id']);
        $products = $this->productService->getPaginatedProducts($filters);

        return Inertia::render('product/index', [
            'products' => $products,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('product/create', $this->productService->getFormOptions());
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $data = $request->validated();
        unset($data['image']);

        if (isset($data['size_stocks']) && is_array($data['size_stocks'])) {
            $data['size_stocks'] = $this->sanitizeSizeStocks($data['size_stocks']);
            $data['stock'] = array_sum($data['size_stocks']);
        }

        $product = $this->productService->createProduct($data);

        if ($request->hasFile('image')) {
            $path = $this->storeProductImage($request->file('image'));
            if ($path) {
                $product->update(['img' => $path]);
            }
        }

        return redirect()->route('product.index')
            ->with('message', 'Product created successfully.');
    }

    public function show(Product $product): Response
    {
        return Inertia::render('product/show', [
            'product' => $this->productService->getProductDetails($product),
        ]);
    }

    public function shop(Request $request): Response
    {
        $products = $this->productService->getStorefrontProducts();

        return Inertia::render('shop/index', [
            'products' => $products,
        ]);
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('product/edit', [
            'product' => $this->productService->getProductForEdit($product),
            ...$this->productService->getFormOptions(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        $hasImage = $request->hasFile('image');
        $removeImage = $request->boolean('remove_image');
        unset($data['image'], $data['remove_image']);

        if (isset($data['size_stocks']) && is_array($data['size_stocks'])) {
            $data['size_stocks'] = $this->sanitizeSizeStocks($data['size_stocks']);
            $data['stock'] = array_sum($data['size_stocks']);
        }

        $oldImg = $product->img;
        $this->productService->updateProduct($product, $data);

        if ($hasImage) {
            $path = $this->storeProductImage($request->file('image'));
            if ($path) {
                $product->update(['img' => $path]);
                $this->deleteProductImage($oldImg);
            }
        } elseif ($removeImage) {
            $product->update(['img' => null]);
            $this->deleteProductImage($oldImg);
        }

        return redirect()->route('product.index')
            ->with('message', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->deleteProductImage($product->img);
        $this->productService->deleteProduct($product);

        return redirect()->route('product.index')
            ->with('message', 'Product deleted successfully.');
    }

    public function showImage(Request $request, Product $product): \Illuminate\Http\Response
    {
        return $this->serveStoredImage($request, $product);
    }

    private function storeProductImage(UploadedFile $file): ?string
    {
        if (! function_exists('imagecreatetruecolor')) {
            return null; // GD not available
        }

        $mime = $file->getMimeType();
        $source = match ($mime) {
            'image/jpeg', 'image/pjpeg' => @imagecreatefromjpeg($file->getPathname()),
            'image/png' => @imagecreatefrompng($file->getPathname()),
            'image/webp' => @imagecreatefromwebp($file->getPathname()),
            default => null,
        };

        if ($source === false || $source === null) {
            return null;
        }

        $width = imagesx($source);
        $height = imagesy($source);

        if ($width > 1200) {
            $newHeight = (int) round($height * (1200.0 / $width));
            $resized = imagecreatetruecolor(1200, $newHeight);
            imagecopyresampled($resized, $source, 0, 0, 0, 0, 1200, $newHeight, $width, $height);
            imagedestroy($source);
            $source = $resized;
        }

        $filename = 'products/' . uniqid('product_', true) . '.webp';
        $ok = false;
        $bytes = '';

        if (function_exists('imagewebp')) {
            ob_start();
            $ok = imagewebp($source, null, 85);
            $bytes = ob_get_clean();
        } else {
            ob_start();
            $ok = imagejpeg($source, null, 85);
            $bytes = ob_get_clean();
            $filename = str_replace('.webp', '.jpg', $filename);
        }

        imagedestroy($source);

        if (! $ok || $bytes === '') {
            return null;
        }

        Storage::disk('public')->put($filename, $bytes);

        return $filename;
    }

    private function deleteProductImage(?string $path): void
    {
        if ($path !== null && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Keep only standard US shoe sizes (7-12) as keys and coerce
     * quantities to non-negative integers.
     *
     * @return array<string, int>
     */
    private function sanitizeSizeStocks(array $sizeStocks): array
    {
        $allowedSizes = ['7', '8', '9', '10', '11', '12'];
        $sanitized = [];

        foreach ($sizeStocks as $size => $quantity) {
            $key = (string) $size;
            if (in_array($key, $allowedSizes, true)) {
                $sanitized[$key] = max(0, (int) $quantity);
            }
        }

        return $sanitized;
    }
}
