<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ServesStoredImage;
use App\Http\Requests\Brand\StoreBrandRequest;
use App\Http\Requests\Brand\UpdateBrandRequest;
use App\Models\Brand;
use App\Services\BrandService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    use ServesStoredImage;

    public function __construct(private BrandService $brandService) {}

    public function index(Request $request): Response
    {
        $filters = $request->only('search');

        return Inertia::render('brand/index', [
            'brands' => $this->brandService->getPaginatedBrands($filters),
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('brand/create');
    }

    public function store(StoreBrandRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('logo')) {
            $validated['img'] = Storage::disk('public')->store('brands', 'public');
        }

        $this->brandService->createBrand($validated);

        return redirect()->route('brand.index')->with('success', 'Brand created successfully.');
    }

    public function show(Brand $brand): Response
    {
        return Inertia::render('brand/show', [
            'brand' => $this->brandService->getBrandWithProductCount($brand),
        ]);
    }

    public function edit(Brand $brand): Response
    {
        return Inertia::render('brand/edit', [
            'brand' => $brand,
        ]);
    }

    public function update(UpdateBrandRequest $request, Brand $brand): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('logo')) {
            if ($brand->img) {
                Storage::disk('public')->delete($brand->img);
            }

            $validated['img'] = Storage::disk('public')->store('brands', 'public');
        }

        $this->brandService->updateBrand($brand, $validated);

        return redirect()->route('brand.index')->with('success', 'Brand updated successfully.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        if ($brand->img) {
            Storage::disk('public')->delete($brand->img);
        }

        $this->brandService->deleteBrand($brand);

        return redirect()->route('brand.index')->with('success', 'Brand deleted successfully.');
    }

    public function showImage(Request $request, Brand $brand): \Illuminate\Http\Response
    {
        return $this->serveStoredImage($request, $brand);
    }
}
