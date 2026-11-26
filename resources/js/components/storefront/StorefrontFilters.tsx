import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface StorefrontFiltersProps {
    brands: string[];
    selectedBrand: string;
    onSelectBrand: (brand: string) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    totalStyles: number;
}

export default function StorefrontFilters({
    brands,
    selectedBrand,
    onSelectBrand,
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    totalStyles,
}: StorefrontFiltersProps) {
    return (
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">
                    The collection
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                    Shoes for every day
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                    {totalStyles ?? 0} {totalStyles === 1 ? 'style' : 'styles'} to explore
                </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-2xl">
                <div className="relative min-w-0 flex-1">
                    <Search
                        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    />
                    <Input
                        aria-label="Search shoes"
                        autoComplete="off"
                        className="h-11 pl-9"
                        name="storefront-search"
                        placeholder="Search shoes, brand, or size"
                        value={searchQuery}
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                </div>
                <select
                    aria-label="Sort shoes"
                    className="border-input bg-background h-11 rounded-md border px-3 text-sm sm:w-48"
                    value={sortBy}
                    onChange={(event) => onSortChange(event.currentTarget.value)}
                >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="in-stock-first">In Stock First</option>
                </select>
            </div>
            <nav id="brands" className="mt-5 flex flex-wrap gap-2 pb-2" aria-label="Filter by brand">
                {['All', ...brands].map((brand) => (
                    <Button
                        key={brand}
                        type="button"
                        size="sm"
                        variant={selectedBrand === brand ? 'default' : 'outline'}
                        className="shrink-0 rounded-full px-4"
                        aria-pressed={selectedBrand === brand}
                        onClick={() => onSelectBrand(brand)}
                    >
                        {brand}
                    </Button>
                ))}
            </nav>
        </div>
    );
}
