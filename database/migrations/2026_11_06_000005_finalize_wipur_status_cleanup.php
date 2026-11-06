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
        if (Schema::hasColumn('wipur_requests', 'sub_status')) {
            DB::statement("ALTER TABLE `wipur_requests` MODIFY COLUMN `sub_status` ENUM('waiting_for_supervisor_approval', 'waiting_for_admin_approval', 'returned', 'approved', 'declined', 'completed', 'Waiting for Confirmation', 'Confirmed') NULL");
        }

        if (Schema::hasColumn('wipur_requests', 'workflow_status')) {
            DB::statement(
                "UPDATE `wipur_requests`
                 SET `sub_status` = CASE
                     WHEN `sub_status` IS NOT NULL AND `sub_status` <> '' THEN `sub_status`
                     WHEN `workflow_status` = 'pending' THEN 'waiting_for_supervisor_approval'
                     WHEN `workflow_status` = 'waiting_for_supervisor' THEN 'waiting_for_supervisor_approval'
                     WHEN `workflow_status` = 'waiting_for_admin' THEN 'waiting_for_admin_approval'
                     WHEN `workflow_status` = 'returned' THEN 'returned'
                     WHEN `workflow_status` = 'approved' THEN 'approved'
                     WHEN `workflow_status` = 'declined' THEN 'declined'
                     WHEN `workflow_status` = 'completed' THEN 'completed'
                     ELSE NULL
                 END
                 WHERE `sub_status` IS NULL OR `sub_status` = ''"
            );
        }

        if (Schema::hasColumn('wipur_steps', 'status')) {
            DB::statement("ALTER TABLE `wipur_steps` MODIFY COLUMN `status` ENUM('waiting_for_approval', 'waiting_for_supervisor_approval', 'waiting_for_admin_approval', 'approved', 'declined', 'returned', 'completed') NULL DEFAULT 'waiting_for_approval'");

            DB::statement(
                "UPDATE `wipur_steps`
                 SET `status` = CASE
                     WHEN `status` = 'waiting_for_supervisor' THEN 'waiting_for_supervisor_approval'
                     WHEN `status` = 'waiting_for_admin' THEN 'waiting_for_admin_approval'
                     WHEN `status` = 'waiting_for_approval' THEN 'waiting_for_supervisor_approval'
                     WHEN `status` = 'approved' THEN 'approved'
                     WHEN `status` = 'declined' THEN 'declined'
                     WHEN `status` = 'returned' THEN 'returned'
                     WHEN `status` = 'completed' THEN 'completed'
                     ELSE 'waiting_for_approval'
                 END"
            );
        }

        if (Schema::hasColumn('wipur_requests', 'workflow_status')) {
            DB::statement('ALTER TABLE `wipur_requests` DROP COLUMN `workflow_status`');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('wipur_requests', 'workflow_status')) {
            DB::statement("ALTER TABLE `wipur_requests` ADD COLUMN `workflow_status` ENUM('pending', 'waiting_for_supervisor', 'waiting_for_admin', 'returned', 'approved', 'declined', 'completed') NULL DEFAULT 'pending' AFTER `status_id`");

            DB::statement(
                "UPDATE `wipur_requests`
                 SET `workflow_status` = CASE
                     WHEN `sub_status` = 'waiting_for_supervisor_approval' THEN 'waiting_for_supervisor'
                     WHEN `sub_status` = 'waiting_for_admin_approval' THEN 'waiting_for_admin'
                     WHEN `sub_status` = 'returned' THEN 'returned'
                     WHEN `sub_status` = 'approved' THEN 'approved'
                     WHEN `sub_status` = 'declined' THEN 'declined'
                     WHEN `sub_status` = 'completed' THEN 'completed'
                     ELSE 'pending'
                 END"
            );
        }

        if (Schema::hasColumn('wipur_steps', 'status')) {
            DB::statement("ALTER TABLE `wipur_steps` MODIFY COLUMN `status` ENUM('waiting_for_approval', 'waiting_for_supervisor', 'waiting_for_admin', 'approved', 'declined', 'returned', 'completed') NULL DEFAULT 'waiting_for_approval'");
        }
    }
};
