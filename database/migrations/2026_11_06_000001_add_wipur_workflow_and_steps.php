<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('wipur_requests', 'workflow_status')) {
            Schema::table('wipur_requests', function (Blueprint $table) {
                $table->enum('workflow_status', [
                    'pending',
                    'waiting_for_supervisor',
                    'waiting_for_admin',
                    'returned',
                    'approved',
                    'declined',
                ])->nullable()->after('status_id');
            });
        }

        if (! Schema::hasTable('wipur_steps')) {
            Schema::create('wipur_steps', function (Blueprint $table) {
                $table->id();

                $table->foreignId('wipur_request_id')
                    ->constrained('wipur_requests')
                    ->cascadeOnDelete();

                $table->enum('step', ['supervisor', 'admin']);
                $table->unsignedTinyInteger('step_order');

                $table->enum('status', [
                    'waiting_for_approval',
                    'approved',
                    'declined',
                    'returned',
                ])->default('waiting_for_approval');

                $table->foreignId('assigned_to_user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('approved_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamp('approved_at')->nullable();

                $table->foreignId('declined_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamp('declined_at')->nullable();
                $table->text('decline_reason')->nullable();
                $table->text('remarks')->nullable();
                $table->timestamp('notified_at')->nullable();

                $table->timestamps();

                $table->unique(['wipur_request_id', 'step']);
                $table->index(['wipur_request_id', 'status']);
                $table->index(['assigned_to_user_id', 'status']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wipur_steps');

        if (Schema::hasColumn('wipur_requests', 'workflow_status')) {
            Schema::table('wipur_requests', function (Blueprint $table) {
                $table->dropColumn('workflow_status');
            });
        }
    }
};
