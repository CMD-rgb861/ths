<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Signatory;
use App\Models\User;

class SignatoryController extends Controller
{
    // GET /signatory/it-director
    public function show(Request $request)
    {
        $signatory = Signatory::where('role', 'it_director')->with('user')->first();
        return response()->json($signatory, 200);
    }

    // POST /signatory/it-director
    public function update(Request $request)
    {
        // Only admin can set signatory
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'name' => ['nullable', 'string'],
        ]);

        $signatory = Signatory::firstOrNew(['role' => 'it_director']);
        $signatory->user_id = $validated['user_id'] ?? null;
        $signatory->name = $validated['name'] ?? null;
        $signatory->save();

        return response()->json($signatory->load('user'), 200);
    }
}
