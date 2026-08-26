<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\JobOrderController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\SignatoryController;
use App\Http\Controllers\ActionReportController;
use App\Http\Controllers\UnserviceableReportController;
use App\Http\Controllers\CompletedReportController;
use App\Http\Controllers\SerialNumberController;
use App\Http\Controllers\JobOrderQueueController;
use App\Http\Controllers\SummaryRequestReportController;
use App\Http\Controllers\SoftwareNameController;
use App\Models\JobOrder;

/*
|-------------------------------------------------------------------------- 
| PUBLIC ROUTES 
|-------------------------------------------------------------------------- 
*/
Route::post('/login', [LoginController::class, 'login']);

Route::middleware('auth')->get('/auth/status', function (Request $request) {
    $user = $request->user();

    return response()->json([
        'authenticated' => (bool) $user,
        'user' => $user ? [
            'id' => $user->id,
            'id_number' => $user->id_number,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name')->toArray(),
        ] : null,
    ]);
});

/*
|-------------------------------------------------------------------------- 
| PROTECTED ROUTES 
|-------------------------------------------------------------------------- 
*/
Route::middleware('auth:sanctum')->group(function () {

    // Authentication routes
    Route::post('/logout', [LoginController::class, 'logout']);

    // Users routes
    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/counts', [UserController::class, 'counts']);
    Route::get('/roles', [UserController::class, 'roles']);
    Route::put('/users/{user}/role', [UserController::class, 'updateRole']);

    // Technicians
    Route::get('/technicians', [UserController::class, 'technicians']);

    // Reference data routes
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/request-statuses', [\App\Http\Controllers\RequestStatusController::class, 'index']);

    // ============================================
    // JOB ORDERS ROUTES
    // ============================================
    Route::get('/job-orders', [JobOrderController::class, 'index']);
    Route::post('/job-orders', [JobOrderController::class, 'store']);
    Route::get('/job-orders/service-status', [JobOrderController::class, 'serviceStatus']);

    // ============================================
    // JOB ORDER EXPORT ROUTES
    // ============================================
    Route::get('/job-orders/export-count', [JobOrderController::class, 'exportCount']);
    Route::get('/job-orders/export', [JobOrderController::class, 'export']);

    // ============================================
    // SINGLE JOB ORDER ROUTES
    // ============================================
    Route::get('/job-orders/{jobOrder}', [JobOrderController::class, 'show'])->name('job-orders.show');
    Route::put('/job-orders/{jobOrder}', [JobOrderController::class, 'update']);
    Route::patch('/job-orders/{jobOrder}/confirm-diagnosis',
        [ActionReportController::class, 'confirm'])
        ->name('job-orders.confirm');

    // ============================================
    // ACTION REPORTS ROUTES
    // ============================================
    Route::post('/job-orders/{jobOrder}/action-report', [ActionReportController::class, 'store']);
    Route::put('/job-orders/{jobOrder}/action-report', [ActionReportController::class, 'update']);
    Route::post('/job-orders/{jobOrder}/action-report/csm', [ActionReportController::class, 'storeCsm']);
    Route::put('/job-orders/{jobOrder}/action-report/unserviceable', [ActionReportController::class, 'updateUnserviceable']);  

    // Service Statuses for action_taken dropdown
    Route::get('/service-statuses', [ActionReportController::class, 'serviceStatuses']);

    // Upload supporting files
    Route::post('/job-orders/{jobOrder}/upload-files', [ActionReportController::class, 'uploadFiles']);
    Route::get('/job-orders/{jobOrder}/download-report', function (JobOrder $jobOrder) {
        abort_unless($jobOrder->final_report_pdf, 404);
        return response()->download(storage_path('app/public/' . $jobOrder->final_report_pdf));
    });

    // ===============================
    // UNSERVICEABLE REPORT ROUTES
    // ===============================
    Route::get('/job-orders/{job}/unserviceable/pdf',
        [UnserviceableReportController::class, 'generate']
    );

    Route::get('/job-orders/{job}/unserviceable/view',
        [UnserviceableReportController::class, 'generate']
    );

    // ===============================
    // COMPLETED REPORT ROUTES
    // ===============================
    Route::get('/job-orders/{job}/completed/view',
        [CompletedReportController::class, 'generate']
    );

    // ===============================
    // PENDING NOTIFICATIONS ROUTES
    // ===============================
    Route::middleware('auth:sanctum')->get('/job-orders/pending-count', [JobOrderController::class, 'pendingCount']);
    Route::post('/job-orders/mark-pending-notified', [JobOrderController::class, 'markPendingNotified']);
    Route::post('/job-orders/{jobOrder}/mark-notifications-read', [JobOrderController::class, 'markNotificationsRead']);

    // ===============================
    // SIGNATORY ROUTES (IT Director)
    // ===============================
    Route::get('/signatory/it-director', [SignatoryController::class, 'show']);
    Route::post('/signatory/it-director', [SignatoryController::class, 'update']);

    // Approve a job order (set approved_by and approval_date)
    Route::post('/job-orders/{jobOrder}/approve', [JobOrderController::class, 'approve']);

    // ===============================
    // SERIAL NUMBER ROUTES
    // ===============================
    Route::get('/serial-number/search', [SerialNumberController::class, 'search']);
    Route::get('/serial-number/history', [SerialNumberController::class, 'history']);
    Route::get('/serial-number/autocomplete', [SerialNumberController::class, 'autocomplete']);
    Route::get('/serial-number/export', [SerialNumberController::class, 'export']);

    // ===============================
    // SOFTWARE NAME ROUTES
    // ===============================
    Route::get('/software-name/search', [SoftwareNameController::class, 'search']);
    Route::get('/software-name/export', [SoftwareNameController::class, 'export']);
    Route::get('/software-name/export-count', [SoftwareNameController::class, 'exportCount']);

    // ===============================
    // PENDING CONFIRMATIONS ROUTE
    // ===============================
    Route::get('/pending-confirmations', [\App\Http\Controllers\PendingConfirmationController::class, 'index']);

    // ===============================
    // QUEUE ROUTES
    // ===============================
    Route::get('/queue', [JobOrderQueueController::class, 'index']);
    Route::get('/queue/stats', [JobOrderQueueController::class, 'getStats']);
    Route::get('/queue/user-jobs', [JobOrderQueueController::class, 'getUserJobsInQueue']);
    Route::get('/queue/{jobOrder}/position', [JobOrderQueueController::class, 'getPosition']);

    // ===============================
    // SUMMARY REQUEST REPORT ROUTES
    // ===============================
    Route::get('/reports/daily', [SummaryRequestReportController::class, 'daily']);
    Route::get('/reports/weekly', [SummaryRequestReportController::class, 'weekly']);
    Route::get('/reports/monthly', [SummaryRequestReportController::class, 'monthly']);

});