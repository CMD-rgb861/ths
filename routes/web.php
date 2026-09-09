<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CompletedReportController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\JobOrder;

Route::get('/', function () {
    // return redirect()->route('login');
    $ip = getHostByName(getHostName());
    return redirect()->away(
        "https://{$ip}/ids/itsms/home/n"
    );
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware('auth')->name('dashboard');

Route::get('/dashboard/{any}', function () {
    return Inertia::render('Dashboard');
})->middleware('auth')->where('any', '.*');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/job-orders/{job}/completed/view', function (JobOrder $job) {
        return app(CompletedReportController::class)->generate($job->id);
    });
});

require __DIR__.'/auth.php';
