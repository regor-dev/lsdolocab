<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserProfileIsComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->isCustomer() && ! $user->hasCompletedProfile()) {
            return redirect()->route('profile.complete');
        }

        return $next($request);
    }
}
