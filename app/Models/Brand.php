<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

#[Fillable(['brand_name', 'img'])]
class Brand extends Model
{
    /** @use HasFactory<\\Database\\Factories\\BrandFactory> */
    use HasFactory;

    protected $hidden = ['img'];

    protected $appends = ['logo_url'];

    public function getLogoUrlAttribute(): ?string
    {
        $logo = $this->img;

        if (empty($logo)) {
            return null;
        }

        // External links (http(s)://) are returned as-is; local storage
        // paths are resolved through the public disk, returning null when
        // the file is missing so broken image icons never render.
        if (str_starts_with($logo, 'http://') || str_starts_with($logo, 'https://')) {
            return $logo;
        }

        return Storage::disk('public')->exists($logo)
            ? Storage::disk('public')->url($logo)
            : null;
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public static function paginated(array $filters = []): LengthAwarePaginator
    {
        $query = static::query()
            ->withCount('products')
            ->when(! empty($filters['search'] ?? ''), fn ($query) => $query->where('brand_name', 'like', '%'.$filters['search'].'%'))
            ->latest();

        return $query->paginate(10)->withQueryString();
    }

    public static function formOptions(): Collection
    {
        return static::query()->select(['id', 'brand_name'])->get();
    }
}
