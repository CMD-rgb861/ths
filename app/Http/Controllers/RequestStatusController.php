<?php

namespace App\Http\Controllers;

use App\Models\RequestStatus;
use Illuminate\Support\Facades\Schema;

class RequestStatusController extends Controller
{
    public function index()
    {
        if (!Schema::hasTable('request_statuses')) {
            return response()->json([], 200);
        }

        return response()->json(RequestStatus::orderBy('name')->get(['id', 'name']));
    }
}
