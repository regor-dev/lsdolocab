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

class ProductSeeder extends Seeder
{
    /**
     * US sneaker sizes for which every product carries per-size stock.
     *
     * @var array<int, string>
     */
    private const SIZES = ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12'];

    /**
     * Seed the storefront catalog with per-US-size stock.
     *
     * Every sneaker gets a realistic `size_stocks` map covering all US sizes
     * above (varied quantities, with occasional `0` out-of-stock sizes), and
     * the seeded `stocks.quantity` is set to the exact sum of `size_stocks`.
     * Fully idempotent via updateOrCreate.
     */
    public function run(): void
    {
        $tables = ['brands', 'size_categories', 'product_variants', 'products', 'stocks'];

        foreach ($tables as $table) {
            if (! Schema::hasTable($table)) {
                $this->command?->error(sprintf(
                    'ProductSeeder: table "%s" is missing. Run migrations first.',
                    $table,
                ));

                return;
            }
        }

        DB::transaction(function (): void {
            $brands = $this->seedBrands();
            $categories = $this->seedCategories();

            foreach ($this->sneakers() as $sneaker) {
                $brand = $brands[$sneaker['brand']] ?? null;
                $category = $categories[$sneaker['category']] ?? null;

                if (! $brand || ! $category) {
                    continue;
                }

                $sizeStocks = $this->normalizeSizeStocks($sneaker['size_stocks']);
                $stock = array_sum($sizeStocks);

                $slug = Str::slug($sneaker['name']);

                $variant = ProductVariant::updateOrCreate(
                    ['sku' => $sneaker['sku']],
                    [
                        'category_id' => $category->id,
                        'color' => $sneaker['colorway'],
                        'size' => $sneaker['size'],
                        'price' => $sneaker['price'],
                    ]
                );

                $product = Product::updateOrCreate(
                    ['name' => $sneaker['name']],
                    [
                        'brand_id' => $brand->id,
                        'product_var_id' => $variant->id,
                        'description' => $sneaker['description'],
                        'img' => $this->placeholderImage($sneaker['name'], $sneaker['colorway']),
                    ]
                );

                // `size_stocks` is not in Product's fillable list, so force it through.
                $product->forceFill(['size_stocks' => $sizeStocks])->save();

                Stock::updateOrCreate(
                    ['product_id' => $product->id],
                    [
                        'quantity' => $stock,
                        'status' => $this->stockStatus($stock),
                    ]
                );
            }
        });
    }

    /**
     * Return `size_stocks` keyed by every US size in self::SIZES.
     *
     * Missing sizes fall back to 0 and extra sizes are dropped, so the stored
     * map matches self::SIZES exactly.
     */
    private function normalizeSizeStocks(array $sizeStocks): array
    {
        $normalized = [];

        foreach (self::SIZES as $size) {
            $normalized[$size] = (int) ($sizeStocks[$size] ?? 0);
        }

        return $normalized;
    }

    private function stockStatus(int $quantity): string
    {
        if ($quantity === 0) {
            return 'out_of_stock';
        }

        return $quantity <= 10 ? 'low_stock' : 'in_stock';
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

    /**
     * @return array<int, array{
     *     brand: string,
     *     category: string,
     *     name: string,
     *     price: float,
     *     sku: string,
     *     colorway: string,
     *     size: string,
     *     size_stocks: array<string, int>,
     *     image_query: string,
     *     description: string,
     * }>
     */
    private function sneakers(): array
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
                'size_stocks' => [
                    '7' => 12, '7.5' => 8, '8' => 15, '8.5' => 20, '9' => 25,
                    '9.5' => 18, '10' => 22, '10.5' => 10, '11' => 5, '12' => 0,
                ],
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
                'size_stocks' => [
                    '7' => 0, '7.5' => 6, '8' => 14, '8.5' => 18, '9' => 20,
                    '9.5' => 16, '10' => 24, '10.5' => 12, '11' => 8, '12' => 4,
                ],
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
                'size_stocks' => [
                    '7' => 4, '7.5' => 6, '8' => 10, '8.5' => 14, '9' => 16,
                    '9.5' => 12, '10' => 18, '10.5' => 10, '11' => 6, '12' => 2,
                ],
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
                'size_stocks' => [
                    '7' => 8, '7.5' => 10, '8' => 16, '8.5' => 20, '9' => 24,
                    '9.5' => 20, '10' => 28, '10.5' => 14, '11' => 10, '12' => 6,
                ],
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
                'size_stocks' => [
                    '7' => 0, '7.5' => 2, '8' => 4, '8.5' => 6, '9' => 8,
                    '9.5' => 10, '10' => 12, '10.5' => 8, '11' => 4, '12' => 0,
                ],
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
                'size_stocks' => [
                    '7' => 6, '7.5' => 10, '8' => 14, '8.5' => 18, '9' => 22,
                    '9.5' => 18, '10' => 20, '10.5' => 14, '11' => 10, '12' => 6,
                ],
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
                'size_stocks' => [
                    '7' => 0, '7.5' => 4, '8' => 8, '8.5' => 12, '9' => 16,
                    '9.5' => 14, '10' => 18, '10.5' => 10, '11' => 6, '12' => 2,
                ],
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
                'size_stocks' => [
                    '7' => 2, '7.5' => 4, '8' => 6, '8.5' => 10, '9' => 14,
                    '9.5' => 12, '10' => 16, '10.5' => 10, '11' => 8, '12' => 4,
                ],
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
                'size_stocks' => [
                    '7' => 10, '7.5' => 14, '8' => 20, '8.5' => 24, '9' => 30,
                    '9.5' => 26, '10' => 28, '10.5' => 18, '11' => 14, '12' => 8,
                ],
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
                'size_stocks' => [
                    '7' => 8, '7.5' => 12, '8' => 16, '8.5' => 20, '9' => 26,
                    '9.5' => 22, '10' => 24, '10.5' => 16, '11' => 12, '12' => 0,
                ],
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
                'size_stocks' => [
                    '7' => 0, '7.5' => 6, '8' => 10, '8.5' => 14, '9' => 18,
                    '9.5' => 16, '10' => 20, '10.5' => 12, '11' => 8, '12' => 4,
                ],
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
                'size_stocks' => [
                    '7' => 4, '7.5' => 8, '8' => 12, '8.5' => 16, '9' => 20,
                    '9.5' => 18, '10' => 22, '10.5' => 14, '11' => 10, '12' => 6,
                ],
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
                'size_stocks' => [
                    '7' => 6, '7.5' => 10, '8' => 14, '8.5' => 18, '9' => 24,
                    '9.5' => 20, '10' => 26, '10.5' => 16, '11' => 12, '12' => 8,
                ],
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
                'size_stocks' => [
                    '7' => 8, '7.5' => 12, '8' => 16, '8.5' => 20, '9' => 26,
                    '9.5' => 22, '10' => 24, '10.5' => 16, '11' => 12, '12' => 8,
                ],
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
                'size_stocks' => [
                    '7' => 0, '7.5' => 8, '8' => 12, '8.5' => 16, '9' => 22,
                    '9.5' => 18, '10' => 20, '10.5' => 14, '11' => 10, '12' => 6,
                ],
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
                'size_stocks' => [
                    '7' => 4, '7.5' => 6, '8' => 10, '8.5' => 14, '9' => 18,
                    '9.5' => 16, '10' => 20, '10.5' => 12, '11' => 8, '12' => 4,
                ],
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
                'size_stocks' => [
                    '7' => 6, '7.5' => 8, '8' => 12, '8.5' => 16, '9' => 20,
                    '9.5' => 18, '10' => 22, '10.5' => 14, '11' => 10, '12' => 6,
                ],
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
                'size_stocks' => [
                    '7' => 2, '7.5' => 4, '8' => 8, '8.5' => 12, '9' => 16,
                    '9.5' => 14, '10' => 16, '10.5' => 10, '11' => 8, '12' => 4,
                ],
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
                'size_stocks' => [
                    '7' => 0, '7.5' => 4, '8' => 8, '8.5' => 12, '9' => 16,
                    '9.5' => 14, '10' => 18, '10.5' => 10, '11' => 6, '12' => 2,
                ],
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
                'size_stocks' => [
                    '7' => 4, '7.5' => 8, '8' => 12, '8.5' => 16, '9' => 20,
                    '9.5' => 18, '10' => 22, '10.5' => 14, '11' => 10, '12' => 6,
                ],
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
                'size_stocks' => [
                    '7' => 0, '7.5' => 6, '8' => 10, '8.5' => 14, '9' => 18,
                    '9.5' => 16, '10' => 20, '10.5' => 12, '11' => 8, '12' => 4,
                ],
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
                'size_stocks' => [
                    '7' => 6, '7.5' => 8, '8' => 12, '8.5' => 16, '9' => 20,
                    '9.5' => 18, '10' => 22, '10.5' => 14, '11' => 10, '12' => 6,
                ],
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
                'size_stocks' => [
                    '7' => 8, '7.5' => 12, '8' => 16, '8.5' => 20, '9' => 26,
                    '9.5' => 22, '10' => 24, '10.5' => 16, '11' => 12, '12' => 8,
                ],
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
                'size_stocks' => [
                    '7' => 0, '7.5' => 10, '8' => 14, '8.5' => 18, '9' => 24,
                    '9.5' => 20, '10' => 26, '10.5' => 16, '11' => 12, '12' => 8,
                ],
                'image_query' => 'high top canvas sneaker',
                'description' => 'High-top canvas sneaker with vulcanized rubber sole.',
            ],
        ];
    }

    private function placeholderImage(string $label, string $background): string
    {
        $hash = crc32($label) & 0xFFFFFF;
        $color = sprintf('#%06X', $hash);
        $label = htmlspecialchars($label, ENT_QUOTES | ENT_XML1, 'UTF-8');
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">'
            .'<rect width="640" height="480" rx="32" fill="'.$color.'"/>'
            .'<circle cx="320" cy="210" r="115" fill="#ffffff" fill-opacity=".12"/>'
            .'<text x="320" y="365" fill="#ffffff" font-family="Arial,sans-serif" font-size="30" text-anchor="middle">'.$label.'</text>'
            .'</svg>';

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }
}
