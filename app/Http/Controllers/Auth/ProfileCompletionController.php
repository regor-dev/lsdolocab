<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\CompleteProfileRequest;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileCompletionController extends Controller
{
    public function __construct(private UserService $userService) {}

    public function edit(Request $request): Response|RedirectResponse
    {
        if (! $this->userService->needsProfileCompletion($request->user())) {
            return to_route('dashboard');
        }

        return Inertia::render('auth/complete-profile', [
            'sessionData' => $request->session()->get('profile.complete.data', []),
        ]);
    }

    public function preview(CompleteProfileRequest $request): Response|RedirectResponse
    {
        if ($request->isMethod('POST')) {
            $validated = $request->validated();
            $request->session()->put('profile.complete.data', $validated);
        }

        return Inertia::render('auth/preview-profile', [
            'data' => $request->session()->get('profile.complete.data'),
        ]);
    }

    public function update(CompleteProfileRequest $request): RedirectResponse
    {
        $data = $request->session()->get('profile.complete.data');

        if ($data) {
            // Preview flow: session data was already validated via the preview request
            $this->userService->completeProfile($request->user(), $data);
            $request->session()->forget('profile.complete.data');
            return to_route('shop')->with('success', 'Your profile is complete.');
        }

        // Direct flow: validated via CompleteProfileRequest
        $validated = $request->validated();

        $this->userService->completeProfile($request->user(), $validated);
        return to_route('shop')->with('success', 'Your profile is complete.');
    }
}
