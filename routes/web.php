<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;

    // Authentication
    
    //Route::post('/logout', [LoginController::class, 'logout'])
    //->middleware('auth:sanctum');
// routes/web.php
Route::view('/{any}', 'welcome')->where('any', '.*');

