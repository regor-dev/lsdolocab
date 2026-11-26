<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $name = $this->faker->name();

        return [
            'user_id' => null,
            'customer_name' => $name,
            'customer_email' => $this->faker->safeEmail(),
            'customer_phone' => $this->faker->optional()->numerify('09#########'),
            'order_number' => strtoupper($this->faker->unique()->bothify('ORD-2026-#####')),
            'order_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'status' => $this->faker->randomElement(['pending', 'processing', 'completed']),
            'total' => $this->faker->randomFloat(2, 20, 1500),
            'billing_name' => $name,
            'billing_address' => $this->faker->streetAddress(),
            'billing_city' => $this->faker->city(),
            'billing_postal_code' => $this->faker->postcode(),
            'billing_country' => 'Philippines',
            'payment_method' => $this->faker->randomElement(['cod', 'gcash', 'card', 'bank_transfer']),
            'payment_reference' => $this->faker->optional()->bothify('TXN-########'),
        ];
    }

    public function forCustomer(User $user): static
    {
        return $this->state(fn () => [
            'user_id' => $user->id,
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'customer_phone' => $user->phone,
            'billing_name' => $user->billing_name ?: $user->name,
            'billing_address' => $user->billing_address ?: $user->address,
        ]);
    }
}
