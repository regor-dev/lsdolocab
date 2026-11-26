<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Tests\Concerns\ActsAsAdmin;
use Tests\TestCase;

class AccountAndBrandImageTest extends TestCase
{
    use RefreshDatabase;
    use ActsAsAdmin;

    public function test_user_and_brand_image_columns_exist(): void
    {
        $this->assertTrue(Schema::hasColumn('users', 'img'));
        $this->assertTrue(Schema::hasColumn('brands', 'img'));
    }

    public function test_a_user_image_is_validated_and_stored_in_the_users_table(): void
    {
        $this->actingAsAdmin();
        $role = Role::factory()->create();

        $this->post('/admin/user', [
            'name' => 'New User',
            'email' => 'new-user@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role_id' => $role->id,
            'image' => $this->pngFile(),
        ])->assertRedirect('/admin/user');

        $user = User::query()->where('email', 'new-user@example.com')->firstOrFail();
        $this->assertStringStartsWith('data:image/png;base64,', $user->img);
    }

    public function test_a_brand_image_is_validated_and_stored_in_the_brands_table(): void
    {
        $this->actingAsAdmin();

        $this->post('/admin/brand', [
            'brand_name' => '  <b>Example Brand</b>  ',
            'image' => $this->pngFile(),
        ])->assertRedirect('/admin/brand');

        $brand = Brand::query()->firstOrFail();
        $this->assertSame('Example Brand', $brand->brand_name);
        $this->assertStringStartsWith('data:image/png;base64,', $brand->img);
    }

    public function test_an_invalid_brand_image_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->post('/admin/brand', [
            'brand_name' => 'Invalid Image Brand',
            'image' => UploadedFile::fake()->createWithContent('not-an-image.png', 'not an image'),
        ])->assertSessionHasErrors('image');

        $this->assertDatabaseCount('brands', 0);
    }

    public function test_a_user_can_remove_their_existing_image(): void
    {
        $this->actingAsAdmin();
        $user = User::factory()->create(['img' => 'data:image/png;base64,existing-image']);
        $role = Role::factory()->create();

        $this->post("/admin/user/{$user->id}", [
            '_method' => 'put',
            'name' => $user->name,
            'email' => $user->email,
            'password' => '',
            'password_confirmation' => '',
            'birth_date' => '',
            'address' => $user->address,
            'role_id' => $role->id,
            'remove_image' => '1',
        ])->assertRedirect('/admin/user');

        $this->assertNull($user->fresh()->img);
    }

    public function test_a_brand_can_remove_its_existing_image(): void
    {
        $this->actingAsAdmin();
        $brand = Brand::factory()->create(['img' => 'data:image/png;base64,existing-image']);

        $this->post("/admin/brand/{$brand->id}", [
            '_method' => 'put',
            'brand_name' => $brand->brand_name,
            'remove_image' => '1',
        ])->assertRedirect('/admin/brand');

        $this->assertNull($brand->fresh()->img);
    }

    private function pngFile(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            'image.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC'),
        );
    }
}
