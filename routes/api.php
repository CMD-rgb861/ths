<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\JobOrderController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\SignatoryController;
use App\Http\Controllers\ActionReportController;
use App\Http\Controllers\UnserviceableReportController;
use App\Http\Controllers\CompletedReportController;
use App\Models\JobOrder;

/*
|-------------------------------------------------------------------------- 
| PUBLIC ROUTES 
|-------------------------------------------------------------------------- 
*/
Route::post('/login', [LoginController::class, 'login']);

/*
|-------------------------------------------------------------------------- 
| PROTECTED ROUTES 
|-------------------------------------------------------------------------- 
*/
Route::middleware('auth:sanctum')->group(function () {

    // Authentication routes
    Route::post('/logout', [LoginController::class, 'logout']);

    // Users routes
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/technicians', [UserController::class, 'technicians']);

    // Reference data routes
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::get('/categories', [CategoryController::class, 'index']);

    // Job Orders routes
    Route::get('/job-orders', [JobOrderController::class, 'index']);
    Route::post('/job-orders', [JobOrderController::class, 'store']);
    Route::get('/job-orders/{jobOrder}', [JobOrderController::class, 'show'])->name('job-orders.show');
    Route::put('/job-orders/{jobOrder}', [JobOrderController::class, 'update']);
    Route::patch('/job-orders/{jobOrder}/confirm-diagnosis',
    [ActionReportController::class, 'confirm'])
    ->name('job-orders.confirm');

    // Action Reports routes
    Route::post('/job-orders/{jobOrder}/action-report', [ActionReportController::class, 'store']);
    Route::put('/job-orders/{jobOrder}/action-report', [ActionReportController::class, 'update']);
    Route::post('/job-orders/{jobOrder}/action-report/csm', [ActionReportController::class, 'storeCsm']);
    Route::put('/job-orders/{jobOrder}/action-report/unserviceable', [ActionReportController::class, 'updateUnserviceable']);  

    // Upload supporting files
    Route::post('/job-orders/{jobOrder}/upload-files', [ActionReportController::class, 'uploadFiles']);
    Route::get('/job-orders/{jobOrder}/download-report', function (JobOrder $jobOrder) {
        abort_unless($jobOrder->final_report_pdf, 404);
        return response()->download(storage_path('app/public/' . $jobOrder->final_report_pdf));
    });

    // ===============================
    // UNSERVICEABLE REPORT ROUTES
    // ===============================
    Route::get('/job-orders/{job}/unserviceable/view',
        [UnserviceableReportController::class, 'view']
    );

    // ===============================
    // COMPLETED REPORT ROUTES
    // ===============================
    Route::get('/job-orders/{job}/completed/view',
        [CompletedReportController::class, 'view']
    );

    // Add this new route to fetch the pending count
    Route::middleware('auth:sanctum')->get('/job-orders/pending-count', [JobOrderController::class, 'pendingCount']);
    // Add this route to handle marking pending jobs as notified
    Route::post('/job-orders/mark-pending-notified', [JobOrderController::class, 'markPendingNotified']);

    // Signatory endpoints (IT Director)
    Route::get('/signatory/it-director', [SignatoryController::class, 'show']);
    Route::post('/signatory/it-director', [SignatoryController::class, 'update']);

    // Approve a job order (set approved_by and approval_date)
    Route::post('/job-orders/{jobOrder}/approve', [JobOrderController::class, 'approve']);

});
