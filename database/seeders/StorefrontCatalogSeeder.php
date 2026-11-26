<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SizeCategory;
use App\Models\Stock;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class StorefrontCatalogSeeder extends Seeder
{
    /**
     * Seed the storefront catalog: brands, categories, product variants,
     * products, and stock. Fully idempotent via updateOrCreate.
     */
    public function run(): void
    {
        $tables = ['brands', 'size_categories', 'product_variants', 'products', 'stocks'];

        foreach ($tables as $table) {
            if (! Schema::hasTable($table)) {
                $this->command?->error(sprintf(
                    'StorefrontCatalogSeeder: table "%s" is missing. Run migrations first.',
                    $table,
                ));

                return;
            }
        }

        $imageService = app(\App\Services\Seeding\SeederImageService::class);

        DB::transaction(function () use ($imageService): void {
            $brands = $this->seedBrands();
            $categories = $this->seedCategories();

            foreach ($this->shoes() as $shoe) {
                $brand = $brands[$shoe['brand']] ?? null;
                $category = $categories[$shoe['category']] ?? null;

                if (! $brand || ! $category) {
                    continue;
                }

                $slug = Str::slug($shoe['name']);
                $imagePath = $imageService->fetchAndStoreProductImage($shoe['image_query'], $slug);

                $variant = ProductVariant::updateOrCreate(
                    ['sku' => $shoe['sku']],
                    [
                        'category_id' => $category->id,
                        'color' => $shoe['colorway'],
                        'size' => $shoe['size'],
                        'price' => $shoe['price'],
                    ]
                );

                $product = Product::updateOrCreate(
                    ['name' => $shoe['name']],
                    [
                        'brand_id' => $brand->id,
                        'product_var_id' => $variant->id,
                        'description' => $shoe['description'],
                        'img' => $imagePath,
                    ]
                );

                Stock::updateOrCreate(
                    ['product_id' => $product->id],
                    [
                        'quantity' => $shoe['stock'],
                        'status' => $this->stockStatus($shoe['stock']),
                    ]
                );
            }
        });
    }

    private function seedBrands(): array
    {
        $names = ['Nike', 'Jordan', 'adidas', 'New Balance', 'On', 'HOKA', 'ASICS', 'Puma', 'Converse'];
        $brands = [];

        foreach ($names as $name) {
            $brands[$name] = Brand::updateOrCreate(['brand_name' => $name]);
        }

        return $brands;
    }

    private function seedCategories(): array
    {
        $names = ['Lifestyle', 'Running', 'Basketball', 'Skateboarding', 'Training & Court'];
        $categories = [];

        foreach ($names as $name) {
            $categories[$name] = SizeCategory::updateOrCreate(['category_name' => $name]);
        }

        return $categories;
    }

    private function stockStatus(int $quantity): string
    {
        if ($quantity === 0) {
            return 'out_of_stock';
        }

        return $quantity <= 10 ? 'low_stock' : 'in_stock';
    }

    /**
     * @return array<int, array{
     *     brand: string,
     *     category: string,
     *     name: string,
     *     price: float,
     *     sku: string,
     *     colorway: string,
     *     size: string,
     *     stock: int,
     *     image_query: string,
     *     description: string,
     * }>
     */
    private function shoes(): array
    {
        return [
            // Nike
            [
                'brand' => 'Nike',
                'category' => 'Lifestyle',
                'name' => 'Nike Air Force 1 \'07',
                'price' => 6195.00,
                'sku' => 'NK-AF1-07',
                'colorway' => 'White/White',
                'size' => 'US 9',
                'stock' => 45,
                'image_query' => 'white leather classic sneaker',
                'description' => 'The all-white leather low-top that defined street style.',
            ],
            [
                'brand' => 'Nike',
                'category' => 'Lifestyle',
                'name' => 'Nike Dunk Low Retro',
                'price' => 6995.00,
                'sku' => 'NK-DL-08',
                'colorway' => 'Black/White',
                'size' => 'US 8',
                'stock' => 38,
                'image_query' => 'retro suede terrace sneaker',
                'description' => 'The low-top skate-turned-street icon in contrasting panels.',
            ],
            [
                'brand' => 'Nike',
                'category' => 'Running',
                'name' => 'Nike Zoom Vomero 5 SE',
                'price' => 9395.00,
                'sku' => 'NK-ZV5-10',
                'colorway' => 'Metallic Silver',
                'size' => 'US 10',
                'stock' => 24,
                'image_query' => 'mesh running shoe athletic',
                'description' => 'Cushioned daily trainer with breathable mesh upper.',
            ],
            [
                'brand' => 'Nike',
                'category' => 'Running',
                'name' => 'Nike Pegasus 42',
                'price' => 7695.00,
                'sku' => 'NK-PG42-09',
                'colorway' => 'Blue/White',
                'size' => 'US 9',
                'stock' => 30,
                'image_query' => 'mesh running shoe athletic',
                'description' => 'Reliable neutral running shoe for everyday mileage.',
            ],
            [
                'brand' => 'Nike',
                'category' => 'Running',
                'name' => 'Nike Alphafly 4',
                'price' => 15495.00,
                'sku' => 'NK-AF4-10',
                'colorway' => 'Volt Black',
                'size' => 'US 10',
                'stock' => 12,
                'image_query' => 'carbon plate racing shoe',
                'description' => 'Elite carbon-plated marathon racing shoe.',
            ],
            // Jordan
            [
                'brand' => 'Jordan',
                'category' => 'Basketball',
                'name' => 'Air Jordan 1 Low OG',
                'price' => 9095.00,
                'sku' => 'JO-1L-09',
                'colorway' => 'Chicago',
                'size' => 'US 9',
                'stock' => 22,
                'image_query' => 'low top basketball sneaker',
                'description' => 'Low-top Jordan heritage in classic color blocking.',
            ],
            [
                'brand' => 'Jordan',
                'category' => 'Basketball',
                'name' => 'Air Jordan 4 Retro',
                'price' => 11395.00,
                'sku' => 'JO-4-10',
                'colorway' => 'Military Black',
                'size' => 'US 10',
                'stock' => 18,
                'image_query' => 'basketball performance shoe',
                'description' => 'Retro basketball shoe with supportive cage.',
            ],
            [
                'brand' => 'Jordan',
                'category' => 'Basketball',
                'name' => 'LeBron XXIV EP',
                'price' => 11495.00,
                'sku' => 'JO-L24-11',
                'colorway' => 'Lakers Purple',
                'size' => 'US 11',
                'stock' => 15,
                'image_query' => 'basketball performance shoe',
                'description' => 'LeBron signature performance basketball shoe.',
            ],
            // adidas
            [
                'brand' => 'adidas',
                'category' => 'Lifestyle',
                'name' => 'adidas Samba OG',
                'price' => 6800.00,
                'sku' => 'AD-SM-08',
                'colorway' => 'White Gum',
                'size' => 'US 8',
                'stock' => 52,
                'image_query' => 'retro suede terrace sneaker',
                'description' => 'Classic indoor soccer silhouette with gum sole.',
            ],
            [
                'brand' => 'adidas',
                'category' => 'Lifestyle',
                'name' => 'adidas Gazelle Indoor',
                'price' => 7000.00,
                'sku' => 'AD-GZ-08',
                'colorway' => 'Collegiate Green',
                'size' => 'US 8',
                'stock' => 40,
                'image_query' => 'retro suede terrace sneaker',
                'description' => 'Suede indoor trainer with vintage terrace appeal.',
            ],
            [
                'brand' => 'adidas',
                'category' => 'Skateboarding',
                'name' => 'adidas Handball Spezial',
                'price' => 6500.00,
                'sku' => 'AD-HS-09',
                'colorway' => 'Green Gum',
                'size' => 'US 9',
                'stock' => 28,
                'image_query' => 'retro suede terrace sneaker',
                'description' => 'Handball heritage shoe with gum rubber outsole.',
            ],
            [
                'brand' => 'adidas',
                'category' => 'Running',
                'name' => 'adidas Ultraboost 5X',
                'price' => 10000.00,
                'sku' => 'AD-UB5X-10',
                'colorway' => 'Core Black',
                'size' => 'US 10',
                'stock' => 20,
                'image_query' => 'mesh running shoe athletic',
                'description' => 'Boost-cushioned neutral running shoe.',
            ],
            [
                'brand' => 'adidas',
                'category' => 'Basketball',
                'name' => 'adidas AE 1 Low',
                'price' => 6500.00,
                'sku' => 'AD-AE1-09',
                'colorway' => 'White',
                'size' => 'US 9',
                'stock' => 33,
                'image_query' => 'basketball performance shoe',
                'description' => 'Anthony Edwards signature low-top basketball shoe.',
            ],
            // New Balance
            [
                'brand' => 'New Balance',
                'category' => 'Lifestyle',
                'name' => 'New Balance 530',
                'price' => 6795.00,
                'sku' => 'NB-530-09',
                'colorway' => 'White Grey',
                'size' => 'US 9',
                'stock' => 35,
                'image_query' => 'retro running sneaker',
                'description' => 'Retro runner with a chunky silhouette.',
            ],
            [
                'brand' => 'New Balance',
                'category' => 'Lifestyle',
                'name' => 'New Balance 550',
                'price' => 7295.00,
                'sku' => 'NB-550-08',
                'colorway' => 'White',
                'size' => 'US 8',
                'stock' => 30,
                'image_query' => 'white leather classic sneaker',
                'description' => 'Clean leather basketball-turned-lifestyle shoe.',
            ],
            [
                'brand' => 'New Balance',
                'category' => 'Lifestyle',
                'name' => 'New Balance 9060',
                'price' => 9995.00,
                'sku' => 'NB-9060-10',
                'colorway' => 'Grey',
                'size' => 'US 10',
                'stock' => 16,
                'image_query' => 'chunky lifestyle sneaker',
                'description' => 'Chunky lifestyle sneaker inspired by 9060 running DNA.',
            ],
            [
                'brand' => 'New Balance',
                'category' => 'Running',
                'name' => 'New Balance Fresh Foam X 1080v14',
                'price' => 9795.00,
                'sku' => 'NB-1080-11',
                'colorway' => 'Blue',
                'size' => 'US 11',
                'stock' => 18,
                'image_query' => 'mesh running shoe athletic',
                'description' => 'Plush neutral daily trainer with Fresh Foam X.',
            ],
            // On & HOKA
            [
                'brand' => 'On',
                'category' => 'Running',
                'name' => 'On Cloudtilt',
                'price' => 10490.00,
                'sku' => 'ON-CT-10',
                'colorway' => 'White/Black',
                'size' => 'US 10',
                'stock' => 14,
                'image_query' => 'max cushioned running shoe',
                'description' => 'Maximum cushioned running shoe from On.',
            ],
            [
                'brand' => 'On',
                'category' => 'Running',
                'name' => 'On Cloudmonster 3',
                'price' => 11490.00,
                'sku' => 'ON-CM3-10',
                'colorway' => 'White/Black',
                'size' => 'US 10',
                'stock' => 14,
                'image_query' => 'max cushioned running shoe',
                'description' => 'Cushioned trainer with CloudTec sole.',
            ],
            [
                'brand' => 'HOKA',
                'category' => 'Running',
                'name' => 'HOKA Clifton 11',
                'price' => 9995.00,
                'sku' => 'HK-C11-09',
                'colorway' => 'Black/White',
                'size' => 'US 9',
                'stock' => 20,
                'image_query' => 'daily trainer running shoe',
                'description' => 'Lightweight cushioned daily trainer.',
            ],
            [
                'brand' => 'HOKA',
                'category' => 'Running',
                'name' => 'HOKA Bondi 9',
                'price' => 10995.00,
                'sku' => 'HK-B9-10',
                'colorway' => 'Black/White',
                'size' => 'US 10',
                'stock' => 16,
                'image_query' => 'max cushioned running shoe',
                'description' => 'Max-cushion road running shoe.',
            ],
            // ASICS, Puma & Converse
            [
                'brand' => 'ASICS',
                'category' => 'Running',
                'name' => 'ASICS GEL-KAYANO 33',
                'price' => 11490.00,
                'sku' => 'AS-GK33-10',
                'colorway' => 'White/Black',
                'size' => 'US 10',
                'stock' => 14,
                'image_query' => 'stability running shoe',
                'description' => 'Stability running shoe with GEL cushioning.',
            ],
            [
                'brand' => 'Puma',
                'category' => 'Lifestyle',
                'name' => 'Puma Palermo Leather',
                'price' => 5400.00,
                'sku' => 'PM-PL-08',
                'colorway' => 'White/Green',
                'size' => 'US 8',
                'stock' => 42,
                'image_query' => 'retro suede terrace sneaker',
                'description' => 'Leather terrace sneaker with gum sole.',
            ],
            [
                'brand' => 'Converse',
                'category' => 'Skateboarding',
                'name' => 'Converse Chuck 70 High',
                'price' => 4790.00,
                'sku' => 'CV-C70-09',
                'colorway' => 'Black',
                'size' => 'US 9',
                'stock' => 36,
                'image_query' => 'high top canvas sneaker',
                'description' => 'High-top canvas sneaker with vulcanized rubber sole.',
            ],
        ];
    }
}
