<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class DashboardAccessTest extends TestCase
{

    public function test_dashboard_requires_authentication(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirectContains('/login');
    }

    public function test_authenticated_user_can_view_dashboard(): void
    {
        $user = new User([
            'id' => 1,
            'id_number' => '12345',
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk();
    }
}
