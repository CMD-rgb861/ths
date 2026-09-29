<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CompletedReportController;
use App\Http\Controllers\UnserviceableReportController;
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
    })->name('job-orders.completed.view');

    Route::get('/job-orders/{job}/completed/pdf', function (JobOrder $job) {
        return app(CompletedReportController::class)->generate($job->id);
    })->name('job-orders.completed.pdf');

    Route::get('/job-orders/{job}/unserviceable/view', function (JobOrder $job) {
        return app(UnserviceableReportController::class)->generate($job);
    })->name('job-orders.unserviceable.view');

    Route::get('/job-orders/{job}/unserviceable/pdf', function (JobOrder $job) {
        return app(UnserviceableReportController::class)->generate($job);
    })->name('job-orders.unserviceable.pdf');
});

require __DIR__.'/auth.php';
