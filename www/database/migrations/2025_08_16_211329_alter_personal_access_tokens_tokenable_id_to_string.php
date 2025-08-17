<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // 既存の複合インデックスを一旦外す（名前はSanctumのデフォルト）
            $table->dropIndex('personal_access_tokens_tokenable_type_tokenable_id_index');

            // BIGINT -> VARCHAR(64) に変更
            $table->string('tokenable_id', 64)->change();

            // 複合インデックスを再作成
            $table->index(['tokenable_type', 'tokenable_id'], 'personal_access_tokens_tokenable_type_tokenable_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropIndex('personal_access_tokens_tokenable_type_tokenable_id_index');
            $table->unsignedBigInteger('tokenable_id')->change();
            $table->index(['tokenable_type', 'tokenable_id'], 'personal_access_tokens_tokenable_type_tokenable_id_index');
        });
    }
};

