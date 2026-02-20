<?php
// app/Providers/AuthServiceProvider.php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        // Add your policies here if any
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        // Define the 'admin-only' gate
        Gate::define('admin-only', function (User $user) {
            return $user->isAdmin(); // Assuming the `isAdmin()` method exists in User model
        });
    }
}

