<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        $statusNames = ['Pending', 'Ongoing', 'Completed', 'Cancelled'];

        foreach ($statusNames as $statusName) {
            DB::table('request_statuses')->updateOrInsert(['name' => $statusName]);
        }

        $statusIdsByName = DB::table('request_statuses')
            ->whereIn('name', $statusNames)
            ->pluck('id', 'name');

        $pendingStatusId = $statusIdsByName['Pending'] ?? null;

        if ($pendingStatusId === null) {
            throw new RuntimeException('Unable to resolve the Pending request status ID.');
        }

        DB::statement(sprintf(
            "UPDATE job_orders SET status = CASE status %s ELSE %d END",
            collect($statusIdsByName)
                ->map(fn ($statusId, $statusName) => sprintf("WHEN '%s' THEN %d", str_replace("'", "''", $statusName), $statusId))
                ->implode(' '),
            $pendingStatusId
        ));

        Schema::table('job_orders', function (Blueprint $table) use ($pendingStatusId) {
            $table->unsignedBigInteger('status')->default($pendingStatusId)->change();
        });

        $hasForeignKey = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', DB::connection()->getDatabaseName())
            ->where('TABLE_NAME', 'job_orders')
            ->where('COLUMN_NAME', 'status')
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->exists();

        if (!$hasForeignKey) {
            Schema::table('job_orders', function (Blueprint $table) {
                $table->foreign('status')->references('id')->on('request_statuses');
            });
        }
    }

    public function down()
    {
        $hasForeignKey = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', DB::connection()->getDatabaseName())
            ->where('TABLE_NAME', 'job_orders')
            ->where('COLUMN_NAME', 'status')
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->exists();

        if ($hasForeignKey) {
            Schema::table('job_orders', function (Blueprint $table) {
                $table->dropForeign(['status']);
            });
        }

        DB::statement("UPDATE job_orders SET status = COALESCE((SELECT name FROM request_statuses WHERE request_statuses.id = job_orders.status), 'Pending')");

        Schema::table('job_orders', function (Blueprint $table) {
            $table->string('status', 32)->default('Pending')->change();
        });
    }
};
