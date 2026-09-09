<?php

// database/migrations/2026_01_15_000002_alter_departments_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('departments', function (Blueprint $table) {
            // Add new columns
            $table->string('shorten')->nullable()->after('name');
            $table->foreignId('parent_office_id')->nullable()->after('shorten');
            $table->string('icon')->nullable()->after('parent_office_id');
            $table->foreignId('updated_by')->nullable()->after('icon');
            
            // Rename updated_at to update_at
            $table->renameColumn('updated_at', 'update_at');
        });
    }

    public function down(): void {
        Schema::table('departments', function (Blueprint $table) {
            // Reverse the changes
            $table->dropColumn(['shorten', 'parent_office_id', 'icon', 'updated_by']);
            $table->renameColumn('update_at', 'updated_at');
        });
    }
};