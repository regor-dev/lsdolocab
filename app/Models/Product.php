<?php

namespace App\Models;

use App\Models\Brand;
use App\Models\Stock;
use App\Models\OrderItem;
use App\Models\StockMovement;
use App\Models\ProductVariant;
use App\Models\Concerns\FlushesDashboardCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\CastsAttributes;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Pagination\LengthAwarePaginator;

#[Fillable(['brand_id', 'product_var_id', 'name', 'description', 'img', 'size_stocks'])]
#[CastsAttributes(['size_stocks' => 'array'])]

class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory, FlushesDashboardCache;

    protected $hidden = ['img'];

    protected $appends = ['image_url'];

    protected $casts = [
        'size_stocks' => 'array',
    ];

    public function getImageUrlAttribute(): ?string
    {
        $image = $this->img;

        if (empty($image)) {
            return null;
        }

        // External links (http(s)://) are returned as-is; local storage
        // paths are resolved through the public disk.
        if (str_starts_with($image, 'http://') || str_starts_with($image, 'https://')) {
            return $image;
        }

        return Storage::disk('public')->exists($image)
            ? Storage::disk('public')->url($image)
            : null;
    }

    protected static function booted(): void
    {
        static::saving(function (Product $product): void {
            if (is_array($product->size_stocks)) {
                $product->stock = array_sum($product->size_stocks);
            }
        });
    }

    public function getAvailableSizesAttribute(): array
    {
        return array_keys(
            array_filter((array) $this->size_stocks, static fn (int $qty): bool => $qty > 0)
        );
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_var_id');
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public static function paginated(array $filters = []): LengthAwarePaginator
    {
        $query = static::query()
            ->with(['brand:id,brand_name,img', 'variant'])
            ->when(! empty($filters['search'] ?? ''), fn ($query) => $query->where('name', 'like', '%'.$filters['search'].'%'))
            ->when(! empty($filters['brand_id'] ?? null), fn ($query) => $query->where('brand_id', $filters['brand_id']))
            ->latest();

        return $query->paginate(10)->withQueryString();
    }

    public static function storefrontProducts(): Collection
    {
        return static::query()
            ->with([
                'brand:id,brand_name',
                'variant:id,color,size,price',
                'stocks:id,product_id,quantity',
            ])
            ->whereHas('variant')
            ->orderBy('name')
            ->get(['id', 'brand_id', 'product_var_id', 'name', 'description', 'img']);
    }

    public static function findMultipleWithVariant(array $productIds): Collection
    {
        return static::query()
            ->with('variant')
            ->whereIn('id', $productIds)
            ->orderBy('id')
            ->get()
            ->keyBy('id');
    }

    public static function formOptions(): array
    {
        return static::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Product $product) => [
                'value' => $product->id,
                'label' => $product->name,
            ])
            ->all();
    }

    public static function findWithVariant(int $id): Product
    {
        return static::query()->with('variant')->findOrFail($id);
    }
}
