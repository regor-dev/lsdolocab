<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboardService) {}

    public function __invoke(Request $request)
    {
        $user = $request->user();

        if ($user->hasRole('Staff') && ! $user->hasRole('Admin')) {
            return redirect()->route('stocks.index');
        }

        $data = $this->dashboardService->dataFor($user);

        return Inertia::render($data['component'], $data['props']);
    }
}
