<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UnserviceableReportController;

/*
|--------------------------------------------------------------------------
| PDF Route (NO auth middleware)
|--------------------------------------------------------------------------
*/

Route::get('/job-orders/{job}/unserviceable/pdf',
    [UnserviceableReportController::class, 'generate']
)->name('unserviceable.pdf');


/*
|--------------------------------------------------------------------------
| SPA Catch-All (MUST BE LAST)
|--------------------------------------------------------------------------
*/

Route::view('/{any}', 'welcome')->where('any', '.*');