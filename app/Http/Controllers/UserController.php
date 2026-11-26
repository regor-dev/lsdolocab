<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    /**
     * Display a listing of users eager-loading pivot roles.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'role']);
        $users = $this->userService->getPaginatedUsers($filters);

        return Inertia::render('user/index', [
            'users' => $users,
            'filters' => $filters,
            'roles' => $this->userService->getAllRoles(),
        ]);
    }

    /**
     * Serve the stored data-URI avatar as a real, browser-cacheable image so the
     * list page doesn't embed multi-MB base64 strings in every Inertia response.
     */
    public function avatar(Request $request, User $user): HttpResponse
    {
        if (! $user->img || ! preg_match('#^data:(image/(?:jpeg|png|webp));base64,(.+)$#s', $user->img, $m)) {
            abort(404);
        }

        $response = response('', 200, [
            'Content-Type' => $m[1],
            'Cache-Control' => 'private, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
        ])->setEtag(md5($user->id.'|'.$user->updated_at?->timestamp));

        if ($response->isNotModified($request)) {
            return $response; // 304, no decoding
        }

        return $response->setContent(base64_decode($m[2]));
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        return Inertia::render('user/create', [
            'roles' => $this->userService->getAllRoles(),
        ]);
    }

    /**
     * Store a newly created user and attach pivot roles.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->createUser($request->validated());

        return redirect()->route('user.index')
            ->with('success', 'User created successfully.');
    }

    /**
     * Display the specified user with roles.
     */
    public function show(User $user): Response
    {
        return Inertia::render('user/show', [
            'user' => $this->userService->getUserWithRoles($user),
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        return Inertia::render('user/edit', [
            'user' => $this->userService->getUserWithRoles($user),
            'roles' => $this->userService->getAllRoles(),
        ]);
    }

    /**
     * Update user details and sync pivot roles.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->userService->updateUser($user, $request->validated());

        return redirect()->route('user.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->userService->deleteUser($user);

        return redirect()->route('user.index')
            ->with('success', 'User deleted successfully.');
    }
}
