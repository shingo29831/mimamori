<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('guardian_links', function (Blueprint $table) {
            // UUID を使っている前提（users.user_id / residents.resident_id）
            // 既存カラムが uuid でないなら、先に型を合わせてください（->uuid()->change() 等）
            $table->foreign('user_id')
                ->references('user_id')->on('users')
                ->cascadeOnDelete(); // Laravel 8+。旧来は ->onDelete('cascade')

            $table->foreign('resident_id')
                ->references('resident_id')->on('residents')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('guardian_links', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['resident_id']);
        });
    }
};

