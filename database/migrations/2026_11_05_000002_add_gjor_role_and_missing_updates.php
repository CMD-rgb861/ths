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
        if (!Schema::hasTable('gjor_role_user')) {
            Schema::create('gjor_role_user', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('role_id');

                $table->primary(['user_id', 'role_id']);

                $table->index('role_id', 'gjor_role_user_role_id_index');

                $table->foreign('user_id', 'gjor_role_user_user_id_foreign')
                    ->references('id')
                    ->on('users')
                    ->onDelete('cascade');

                $table->foreign('role_id', 'gjor_role_user_role_id_foreign')
                    ->references('id')
                    ->on('roles')
                    ->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('gjor_signatories')) {
            Schema::create('gjor_signatories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('position');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('gjor_job_orders') && !Schema::hasColumn('gjor_job_orders', 'location')) {
            Schema::table('gjor_job_orders', function (Blueprint $table) {
                $table->string('location')->nullable()->after('contact_no');
            });
        }

        if (Schema::hasTable('gjor_job_orders')) {
            Schema::table('gjor_job_orders', function (Blueprint $table) {
                if (!Schema::hasColumn('gjor_job_orders', 'signatory_name')) {
                    $table->string('signatory_name')->nullable();
                }

                if (!Schema::hasColumn('gjor_job_orders', 'signatory_position')) {
                    $table->string('signatory_position')->nullable();
                }
            });
        }

        if (Schema::hasTable('gjor_action_taken')) {
            Schema::table('gjor_action_taken', function (Blueprint $table) {
                if (!Schema::hasColumn('gjor_action_taken', 'is_declined')) {
                    $table->boolean('is_declined')->default(false)->after('action_taken');
                }

                if (!Schema::hasColumn('gjor_action_taken', 'decline_reason')) {
                    $table->text('decline_reason')->nullable()->after('action_taken');
                }

                if (!Schema::hasColumn('gjor_action_taken', 'declined_by')) {
                    $table->unsignedBigInteger('declined_by')->nullable()->after('decline_reason');
                }

                if (Schema::hasColumn('gjor_action_taken', 'declined_by') && !Schema::hasColumn('gjor_action_taken', 'approved_by')) {
                    if (Schema::hasColumn('gjor_action_taken', 'signatory')) {
                        $table->renameColumn('signatory', 'approved_by');
                    } else {
                        $table->string('approved_by')->nullable()->after('declined_by');
                    }
                }

                if (!Schema::hasColumn('gjor_action_taken', 'action_date')) {
                    $table->timestamp('action_date')->nullable()->after('approved_by');
                }
            });
        }

        if (Schema::hasTable('gjor_action_taken')) {
            $this->ensureApprovedByRename();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('gjor_action_taken')) {
            Schema::table('gjor_action_taken', function (Blueprint $table) {
                if (Schema::hasColumn('gjor_action_taken', 'action_date')) {
                    $table->dropColumn('action_date');
                }

                if (Schema::hasColumn('gjor_action_taken', 'approved_by') && !Schema::hasColumn('gjor_action_taken', 'signatory')) {
                    $table->renameColumn('approved_by', 'signatory');
                }

                if (Schema::hasColumn('gjor_action_taken', 'declined_by')) {
                    $table->dropColumn('declined_by');
                }

                if (Schema::hasColumn('gjor_action_taken', 'decline_reason')) {
                    $table->dropColumn('decline_reason');
                }

                if (Schema::hasColumn('gjor_action_taken', 'is_declined')) {
                    $table->dropColumn('is_declined');
                }
            });
        }

        if (Schema::hasTable('gjor_job_orders')) {
            Schema::table('gjor_job_orders', function (Blueprint $table) {
                if (Schema::hasColumn('gjor_job_orders', 'signatory_position')) {
                    $table->dropColumn('signatory_position');
                }

                if (Schema::hasColumn('gjor_job_orders', 'signatory_name')) {
                    $table->dropColumn('signatory_name');
                }

                if (Schema::hasColumn('gjor_job_orders', 'location')) {
                    $table->dropColumn('location');
                }
            });
        }

        if (Schema::hasTable('gjor_signatories')) {
            Schema::dropIfExists('gjor_signatories');
        }

        if (Schema::hasTable('gjor_role_user')) {
            Schema::dropIfExists('gjor_role_user');
        }
    }

    protected function ensureApprovedByRename(): void
    {
        if (!Schema::hasTable('gjor_action_taken')) {
            return;
        }

        if (Schema::hasColumn('gjor_action_taken', 'signatory') && !Schema::hasColumn('gjor_action_taken', 'approved_by')) {
            Schema::table('gjor_action_taken', function (Blueprint $table) {
                $table->renameColumn('signatory', 'approved_by');
            });
        }
    }

};
