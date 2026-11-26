<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ProductVariant;
use App\Services\CrudResourceService;
use App\Services\ProductVariantService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

class ProductVariantController extends CrudResourceController
{
    public function __construct(
        CrudResourceService $resourceService,
        private ProductVariantService $productVariantService,
    ) {
        parent::__construct($resourceService);
    }

    protected function modelClass(): string
    {
        return ProductVariant::class;
    }

    protected function resourceKey(): string
    {
        return 'productvariant';
    }

    protected function resourceTitle(): string
    {
        return 'Product variants';
    }

    protected function hiddenUiRedirect(): ?string
    {
        return '/product';
    }

    protected function fields(): array
    {
        return [
            ['name' => 'category_id', 'column' => 'category.category_name', 'label' => 'Category', 'type' => 'select', 'required' => true],
            ['name' => 'color', 'label' => 'Color', 'type' => 'text', 'required' => true],
            ['name' => 'size', 'label' => 'Size', 'type' => 'text', 'required' => true],
            ['name' => 'sku', 'label' => 'SKU', 'type' => 'text', 'required' => true],
            ['name' => 'price', 'label' => 'Price', 'type' => 'number', 'required' => true, 'step' => '0.01'],
        ];
    }

    protected function columns(): array
    {
        return [
            ['name' => 'sku', 'label' => 'SKU'],
            ['name' => 'category.category_name', 'label' => 'Category'],
            ['name' => 'color', 'label' => 'Color'],
            ['name' => 'size', 'label' => 'Size'],
            ['name' => 'price', 'label' => 'Price'],
        ];
    }

    protected function relations(): array
    {
        return ['category:id,category_name'];
    }

    protected function options(): array
    {
        return $this->productVariantService->getCategoryOptions();
    }

    public function variantOptions(Request $request): \Illuminate\Http\JsonResponse
    {
        $q = $request->string('q')->trim()->toString();

        return response()->json([
            'data' => $this->productVariantService->searchVariants($q),
        ]);
    }

    protected function validationRules(?Model $record): array
    {
        $uniqueSku = Rule::unique('product_variants', 'sku');
        if ($record !== null) {
            $uniqueSku->ignore($record->getKey());
        }

        return [
            'category_id' => ['required', 'integer', 'exists:size_categories,id'],
            'color' => ['required', 'string', 'max:100'],
            'size' => ['required', 'string', 'max:50'],
            'sku' => ['required', 'string', 'max:100', $uniqueSku],
            'price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
        ];
    }

    protected function searchableColumns(): array
    {
        return ['sku', 'color', 'size'];
    }
}
