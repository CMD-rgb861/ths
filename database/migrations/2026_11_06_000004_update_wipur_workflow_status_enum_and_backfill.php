<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('wipur_requests', 'workflow_status')) {
            return;
        }

        DB::statement("ALTER TABLE `wipur_requests` MODIFY COLUMN `workflow_status` ENUM('pending', 'waiting_for_supervisor', 'waiting_for_admin', 'returned', 'approved', 'declined', 'completed') NULL DEFAULT 'pending'");

        DB::statement(
            "UPDATE `wipur_requests`
             SET `workflow_status` = CASE
                 WHEN `workflow_status` IS NOT NULL AND `workflow_status` <> '' THEN `workflow_status`
                 WHEN (SELECT `name` FROM `request_statuses` WHERE `request_statuses`.`id` = `wipur_requests`.`status_id`) = 'Pending' THEN 'pending'
                 WHEN (SELECT `name` FROM `request_statuses` WHERE `request_statuses`.`id` = `wipur_requests`.`status_id`) = 'Completed' THEN 'completed'
                 WHEN (SELECT `name` FROM `request_statuses` WHERE `request_statuses`.`id` = `wipur_requests`.`status_id`) = 'Cancelled' THEN 'declined'
                 WHEN (SELECT `name` FROM `request_statuses` WHERE `request_statuses`.`id` = `wipur_requests`.`status_id`) = 'Ongoing' THEN 'waiting_for_supervisor'
                 ELSE 'pending'
             END
             WHERE `workflow_status` IS NULL OR `workflow_status` = ''"
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('wipur_requests', 'workflow_status')) {
            return;
        }

        DB::statement("ALTER TABLE `wipur_requests` MODIFY COLUMN `workflow_status` ENUM('pending', 'waiting_for_supervisor', 'waiting_for_admin', 'returned', 'approved', 'declined') NULL DEFAULT 'pending'");
    }
};
