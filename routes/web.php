<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UnserviceableReportController;
use App\Http\Controllers\CompletedReportController;

/*
|--------------------------------------------------------------------------
| PDF Route (NO auth middleware)
|--------------------------------------------------------------------------
*/

Route::get('/job-orders/{job}/unserviceable/pdf',
    [UnserviceableReportController::class, 'generate']
)->name('unserviceable.pdf');

Route::get('/job-orders/{job}/completed/pdf',
    [CompletedReportController::class, 'generate']
)->name('completed.pdf');


/*
|--------------------------------------------------------------------------
| SPA Catch-All (MUST BE LAST)
|--------------------------------------------------------------------------
*/

Route::view('/{any}', 'welcome')->where('any', '.*');