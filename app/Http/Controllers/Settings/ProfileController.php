<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\DeleteAccountRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Services\UserService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(private UserService $userService) {}

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'user' => $request->user(),
            'customerProfile' => $request->user()->toCustomerProfile(),
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Show the editable profile form.
     */
    public function editForm(Request $request): Response
    {
        return Inertia::render('settings/edit-profile', [
            'user' => $request->user(),
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $data = $request->session()->get('profile.settings.data');

        if ($data) {
            // Preview flow: session data was already validated via the preview request
            $this->userService->updateProfileSettings($request->user(), $data);
            $request->session()->forget('profile.settings.data');
            return to_route('profile.edit')->with('success', 'Profile updated successfully.');
        }

        // Direct flow: validated via ProfileUpdateRequest
        $validated = $request->validated();

        // Keep phone and cellphone_number in sync: whichever is provided is
        // mirrored onto the other so both fields reflect the latest value.
        if (array_key_exists('phone', $validated) && ! array_key_exists('cellphone_number', $validated)) {
            $validated['cellphone_number'] = $validated['phone'];
        } elseif (array_key_exists('cellphone_number', $validated) && ! array_key_exists('phone', $validated)) {
            $validated['phone'] = $validated['cellphone_number'];
        }

        // Compose the full name from first_name / middle_initial / last_name
        // when both name parts are submitted, and keep billing_name aligned:
        // a blank billing name, or one that still matches the previous name,
        // follows the new name.
        if ($request->filled('first_name') && $request->filled('last_name')) {
            $firstName = $request->input('first_name');
            $middleInitial = $request->input('middle_initial');
            $lastName = $request->input('last_name');
            $fullName = trim($firstName . ($middleInitial ? ' ' . rtrim($middleInitial, '.') . '.' : '') . ' ' . $lastName);
            $validated['name'] = $fullName;
            $previousName = $request->user()->name;
            if (empty($validated['billing_name'] ?? null) || $validated['billing_name'] === $previousName) {
                $validated['billing_name'] = $fullName;
            }
        }

        // Fall back to the primary profile fields when billing fields are
        // left empty while name / address are set.
        if (empty($validated['billing_name'] ?? null) && ! empty($validated['name'] ?? null)) {
            $validated['billing_name'] = $validated['name'];
        }
        if (empty($validated['billing_address'] ?? null) && ! empty($validated['address'] ?? null)) {
            $validated['billing_address'] = $validated['address'];
        }

        $this->userService->updateProfileSettings($request->user(), $validated);

        return to_route('profile.edit')->with('success', 'Profile updated successfully.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(DeleteAccountRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $this->userService->deleteAccount($user);

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
