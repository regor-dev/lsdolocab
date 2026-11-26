<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            // Lazy: only evaluated when the page actually needs it.
            'quote' => function () {
                [$message, $author] = str(Inspiring::quotes()->random())->explode('-', 2);

                return ['message' => trim($message), 'author' => trim($author)];
            },
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->img ? route('user.avatar', ['user' => $user->id]) : null,
                    'profile_complete' => $user->hasCompletedProfile(),
                    'roles' => $user->getRoleNames()->map(fn ($name) => ['name' => $name, 'role_name' => $name])->toArray(),
                ] : null,
                'roles' => $user ? $user->getRoleNames()->map(fn ($name) => ['name' => $name, 'role_name' => $name])->toArray() : [],
                // Spatie: effective permissions for the current user
                'permissions' => $user ? $user->getAllPermissions()->pluck('name')->toArray() : [],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'message' => fn () => $request->session()->get('message'),
            ],
        ];
    }
}
