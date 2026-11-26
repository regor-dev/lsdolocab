<?php

namespace Database\Seeders;

use App\Actions\ApproveStockMovementAction;
use App\Models\Brand;
use App\Models\MovementType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderLog;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\SizeCategory;
use App\Models\Stock;
use App\Models\StockLog;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Demo accounts with known passwords must never be created in production.
        if (app()->isProduction()) {
            $this->command?->error('DatabaseSeeder creates demo accounts with known passwords and will not run in production.');

            return;
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        DB::transaction(function (): void {
            $this->call(NegrosUserSeeder::class);
            $this->call(StorefrontCatalogSeeder::class);

            $roles = $this->seedRoles();
            $users = $this->seedUsers($roles);
            $admin = collect($users)->first(fn (User $user) => $user->hasRole(Role::ADMIN));
            $staff = array_values(array_filter($users, fn (User $user) => $user->hasRole(Role::STAFF)));
            $brands = $this->seedBrands();
            $categories = $this->seedCategories();
            $variants = $this->seedVariants($categories);
            $products = $this->seedProducts($brands, $variants);
            $this->seedStocks($products);
            $movementTypes = $this->seedMovementTypes();
            $movements = $this->seedStockMovements($products, $movementTypes, $staff);
            $this->seedOrders($products, $users, $admin);
            $this->seedStockLogs($movements, $admin);
        });
    }

    private function seedRoles(): array
    {
        $roles = [];

        foreach (Role::NAMES as $name) {
            $roles[$name] = Role::query()->firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        return $roles;
    }

    private function seedUsers(array $roles): array
    {
        $usersData = [
            ['name' => 'System Admin', 'email' => 'admin@gmail.com', 'password' => 'qwerty123', 'age' => 35, 'address' => 'Central Office', 'role' => Role::ADMIN],
            ['name' => 'Morgan Lee', 'email' => 'morgan.staff@example.com', 'password' => 'password', 'age' => 29, 'address' => 'North District', 'role' => Role::STAFF],
            ['name' => 'Alex Rivera', 'email' => 'alex.staff@example.com', 'password' => 'password', 'age' => 32, 'address' => 'East District', 'role' => Role::STAFF],
            ['name' => 'Sam Carter', 'email' => 'sam.staff@example.com', 'password' => 'password', 'age' => 31, 'address' => 'South District', 'role' => Role::STAFF],
            ['name' => 'Jamie Park', 'email' => 'jamie.customer@example.com', 'password' => 'password', 'age' => 24, 'address' => 'West District', 'role' => Role::CUSTOMER],
            ['name' => 'Taylor Reed', 'email' => 'taylor.customer@example.com', 'password' => 'password', 'age' => 27, 'address' => 'Harbor District', 'role' => Role::CUSTOMER],
            ['name' => 'Casey Johnson', 'email' => 'casey.customer@example.com', 'password' => 'password', 'age' => 30, 'address' => 'Central District', 'role' => Role::CUSTOMER],
        ];
        $imageColors = ['#1D3557', '#2A6F97', '#386641', '#457B9D', '#6D597A', '#9C6644', '#A44A3F'];
        $users = [];

        foreach ($usersData as $index => $data) {
            $user = User::query()->firstOrNew(['email' => $data['email']]);

            $user->forceFill([
                'name' => $data['name'],
                'password' => $data['password'], // hashed by the User model's `hashed` cast
                'birth_date' => now()->subYears($data['age'])->toDateString(),
                'age' => $data['age'],
                'address' => $data['address'],
                // User::hasCompletedProfile() requires this. Without it every seeded
                // customer is redirected to /profile/complete on each request.
                'cellphone_number' => '0917'.str_pad((string) ($index + 1), 7, '0', STR_PAD_LEFT),
                'email_verified_at' => now(),
                'img' => $this->placeholderImage($data['name'], $imageColors[$index]),
            ]);

            if ($data['role'] === Role::CUSTOMER) {
                $user->forceFill([
                    'phone' => '09'.str_pad((string) ($index + 10), 9, '0', STR_PAD_LEFT),
                    'billing_name' => $data['name'],
                    'billing_address' => $data['address'],
                    'billing_city' => 'Manila',
                    'billing_postal_code' => '1000',
                    'billing_country' => 'Philippines',
                    'payment_method' => 'cod',
                ]);
            }

            $user->save();
            $user->syncRoles($roles[$data['role']]);
            $users[] = $user;
        }

        return $users;
    }

    private function seedBrands(): array
    {
        $names = ['Nike', 'Adidas', 'Puma', 'New Balance', 'Asics'];
        $colors = ['#111827', '#2563EB', '#15803D', '#B45309', '#6D28D9'];
        $brands = [];

        foreach ($names as $index => $name) {
            $image = $this->placeholderImage($name, $colors[$index]);
            $brand = Brand::query()->firstOrCreate(
                ['brand_name' => $name],
                ['img' => $image]
            );
            $this->addImageIfMissing($brand, $image);
            $brands[] = $brand;
        }

        return $brands;
    }

    private function seedCategories(): array
    {
        $names = [
            'Adult Footwear',
            'Youth Footwear',
            'Kids Footwear',
            'Casual Footwear',
            'Athletic Footwear',
        ];

        return array_map(
            fn (string $name) => SizeCategory::query()->firstOrCreate(['category_name' => $name]),
            $names
        );
    }

    private function seedVariants(array $categories): array
    {
        $variantsData = [
            ['category' => 0, 'color' => 'Triple White', 'size' => 'US 9', 'sku' => 'NK-AF1-001', 'price' => 110.00],
            ['category' => 0, 'color' => 'Core Black', 'size' => 'US 10', 'sku' => 'AD-UB-002', 'price' => 190.00],
            ['category' => 1, 'color' => 'Grey Classic', 'size' => 'US 11', 'sku' => 'NB-990-003', 'price' => 185.00],
            ['category' => 2, 'color' => 'Rose Pink', 'size' => 'US 6', 'sku' => 'PM-KID-004', 'price' => 72.50],
            ['category' => 4, 'color' => 'Ocean Blue', 'size' => 'US 8', 'sku' => 'AS-RUN-005', 'price' => 125.00],
        ];
        $variants = [];

        foreach ($variantsData as $data) {
            $variants[] = ProductVariant::query()->firstOrCreate(
                ['sku' => $data['sku']],
                [
                    'category_id' => $categories[$data['category']]->id,
                    'color' => $data['color'],
                    'size' => $data['size'],
                    'price' => $data['price'],
                ]
            );
        }

        return $variants;
    }

    private function seedProducts(array $brands, array $variants): array
    {
        $productsData = [
            ['name' => 'Air Force 1 \'07', 'description' => 'Classic everyday sneaker.'],
            ['name' => 'Ultraboost Light', 'description' => 'Lightweight running shoe.'],
            ['name' => 'Made in USA 990v6', 'description' => 'Premium lifestyle running shoe.'],
            ['name' => 'Kids Court Runner', 'description' => 'Comfortable shoe for everyday play.'],
            ['name' => 'Gel Pulse Runner', 'description' => 'Supportive shoe for daily training.'],
        ];
        $colors = ['#E9C46A', '#A8DADC', '#D6CCC2', '#F4A261', '#90BE6D'];
        $products = [];

        foreach ($productsData as $index => $data) {
            $image = $this->placeholderImage($data['name'], $colors[$index]);
            $product = Product::query()->firstOrCreate(
                ['name' => $data['name']],
                [
                    'brand_id' => $brands[$index]->id,
                    'product_var_id' => $variants[$index]->id,
                    'description' => $data['description'],
                    'img' => $image,
                ]
            );
            $this->addImageIfMissing($product, $image);
            $products[] = $product;
        }

        return $products;
    }

    private function seedStocks(array $products): void
    {
        $quantities = [20, 8, 0, 42, 12];

        foreach ($products as $index => $product) {
            Stock::query()->firstOrCreate(
                ['product_id' => $product->id],
                [
                    'quantity' => $quantities[$index],
                    // Same rule the app uses, so seeded statuses always match their quantity.
                    'status' => ApproveStockMovementAction::statusForQuantity($quantities[$index]),
                ]
            );
        }
    }

    private function seedMovementTypes(): array
    {
        return [
            'stock in' => MovementType::query()->firstOrCreate(['movement_status' => 'stock in']),
            'stock out' => MovementType::query()->firstOrCreate(['movement_status' => 'stock out']),
        ];
    }

    private function seedStockMovements(array $products, array $movementTypes, array $submitters): array
    {
        $movementData = [
            ['type' => 'stock in', 'quantity' => 5],
            ['type' => 'stock out', 'quantity' => 2],
            ['type' => 'stock in', 'quantity' => 3],
            ['type' => 'stock out', 'quantity' => 1],
            ['type' => 'stock in', 'quantity' => 4],
        ];
        $movements = [];

        foreach ($movementData as $index => $data) {
            $movements[] = StockMovement::query()->firstOrCreate(
                [
                    'product_id' => $products[$index]->id,
                    'movement_id' => $movementTypes[$data['type']]->id,
                ],
                [
                    'quantity_change' => $data['quantity'],
                    // Staff submit movements, never customers.
                    'user_id' => $submitters[$index % count($submitters)]->id,
                ]
            );
        }

        return $movements;
    }

    private function seedOrders(array $products, array $users, User $actor): array
    {
        $customers = array_values(array_filter($users, fn (User $user) => $user->hasRole(Role::CUSTOMER)));
        $fallbackNames = ['Jordan Smith', 'Casey Johnson', 'Avery Brown', 'Riley Davis', 'Quinn Wilson'];
        $statuses = ['completed', 'processing', 'pending', 'completed', 'processing'];
        $quantities = [1, 2, 1, 3, 1];
        $orderItems = [];

        foreach ($products as $index => $product) {
            $unitPrice = (float) $product->variant()->value('price');
            $quantity = $quantities[$index];
            $subTotal = number_format($unitPrice * $quantity, 2, '.', '');
            $customer = $customers[$index % max(count($customers), 1)] ?? null;
            $order = Order::query()->firstOrCreate(
                ['order_number' => sprintf('ORD-SEED-%03d', $index + 1)],
                [
                    'user_id' => $customer?->id,
                    'customer_name' => $customer?->name ?? $fallbackNames[$index],
                    'customer_email' => $customer?->email ?? strtolower(str_replace(' ', '.', $fallbackNames[$index])).'@example.com',
                    'customer_phone' => $customer?->phone,
                    'order_date' => now()->subDays($index)->toDateString(),
                    'status' => $statuses[$index],
                    'total' => $subTotal,
                    'billing_name' => $customer?->billing_name ?? ($customer?->name ?? $fallbackNames[$index]),
                    'billing_address' => $customer?->billing_address ?? ($customer?->address ?? 'Seed billing address'),
                    'billing_city' => $customer?->billing_city ?? 'Manila',
                    'billing_postal_code' => $customer?->billing_postal_code ?? '1000',
                    'billing_country' => $customer?->billing_country ?? 'Philippines',
                    'payment_method' => $customer?->payment_method ?? 'cod',
                    'payment_reference' => $customer ? null : 'SEED-REF-'.$index,
                ]
            );
            $item = OrderItem::query()->firstOrCreate(
                [
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                ],
                [
                    'quantity' => $quantity,
                    'sub_total' => $subTotal,
                ]
            );
            $orderItems[] = $item;

            // Same shape the app writes when a staff member changes an order's status.
            if ($statuses[$index] !== 'pending') {
                OrderLog::query()->firstOrCreate(
                    ['order_id' => $order->id, 'order_item_id' => $item->id],
                    [
                        'user_id' => $actor->id,
                        'action' => "Status changed from pending to {$statuses[$index]}",
                    ]
                );
            }
        }

        return $orderItems;
    }

    private function seedStockLogs(array $movements, User $admin): void
    {
        $statuses = ['approved', 'pending', 'rejected', 'approved', 'pending'];

        foreach ($movements as $index => $movement) {
            $status = $statuses[$index];

            StockLog::query()->firstOrCreate(
                ['user_id' => $movement->user_id, 'stock_movement_id' => $movement->id],
                [
                    'status' => $status,
                    'approved_by' => $status === 'approved' ? $admin->id : null,
                    'rejected_by' => $status === 'rejected' ? $admin->id : null,
                ]
            );
        }
    }

    private function addImageIfMissing(Model $model, string $image): void
    {
        if (! $model->getAttribute('img')) {
            $model->forceFill(['img' => $image])->save();
        }
    }

    private function placeholderImage(string $label, string $background): string
    {
        $label = htmlspecialchars($label, ENT_QUOTES | ENT_XML1, 'UTF-8');
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">'
            .'<rect width="640" height="480" rx="32" fill="'.$background.'"/>'
            .'<circle cx="320" cy="210" r="115" fill="#ffffff" fill-opacity=".12"/>'
            .'<text x="320" y="365" fill="#ffffff" font-family="Arial,sans-serif" font-size="30" text-anchor="middle">'.$label.'</text>'
            .'</svg>';

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }
}
