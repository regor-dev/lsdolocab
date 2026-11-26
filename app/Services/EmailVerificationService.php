<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\Events\Verified;

class EmailVerificationService
{
    public function isVerified(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    public function sendVerificationNotification(User $user): bool
    {
        if ($user->hasVerifiedEmail()) {
            return false;
        }

        $user->sendEmailVerificationNotification();

        return true;
    }

    public function verify(User $user): bool
    {
        if ($user->hasVerifiedEmail()) {
            return false;
        }

        if (! $user->markEmailAsVerified()) {
            return false;
        }

        event(new Verified($user));

        return true;
    }
}
