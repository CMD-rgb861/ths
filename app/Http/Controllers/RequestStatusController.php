<?php

namespace App\Http\Controllers;

use App\Models\RequestStatus;

class RequestStatusController extends Controller
{
    public function index()
    {
        return response()->json(RequestStatus::orderBy('name')->get(['id', 'name']));
    }
}
