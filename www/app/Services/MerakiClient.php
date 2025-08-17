<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Arr;
use RuntimeException;

class MerakiClient
{
    private string $base;
    private string $apiKey;

    public function __construct()
    {
        $this->base  = config('services.meraki.base');
        $this->apiKey = (string) config('services.meraki.key');
        if (!$this->apiKey) {
            throw new RuntimeException('MERAKI_API_KEY is not set.');
        }
    }

    private function http()
    {
        return Http::withHeaders([
            'Accept' => 'application/json',
            'X-Cisco-Meraki-API-Key' => $this->apiKey,
        ])->retry(5, 1000, throw: false); // 429/5xxに軽くリトライ
    }

    public function getOrganizationId(): string
    {
        // 事前に .env 固定があればそれを使う
        if ($fixed = config('services.meraki.org_id')) return $fixed;

        return Cache::remember('meraki.org_id', 3600, function () {
            $res = $this->http()->get("{$this->base}/organizations");
            $this->throwIfFailed($res, 'organizations');
            $org = collect($res->json())->first();
            if (!$org || empty($org['id'])) {
                throw new RuntimeException('No organizations found.');
            }
            return (string) $org['id'];
        });
    }

    public function getNetworkId(string $organizationId): string
    {
        if ($fixed = config('services.meraki.network_id')) return $fixed;

        return Cache::remember("meraki.network_id.{$organizationId}", 3600, function () use ($organizationId) {
            $res = $this->http()->get("{$this->base}/organizations/{$organizationId}/networks");
            $this->throwIfFailed($res, 'networks');
            $net = collect($res->json())->first();
            if (!$net || empty($net['id'])) {
                throw new RuntimeException('No networks found in the organization.');
            }
            return (string) $net['id'];
        });
    }

    public function latestBySensor(string $networkId, string $metric): array
    {
        $res = $this->http()->get("{$this->base}/networks/{$networkId}/sensors/stats/latestBySensor", [
            'metric' => $metric, // temperature / humidity
        ]);
        $this->throwIfFailed($res, "latestBySensor({$metric})");
        return $res->json();
    }

    private function throwIfFailed(Response $res, string $what): void
    {
        if ($res->successful()) return;

        // Meraki はレート制限等でヘッダにヒントが付きます
        $msg = sprintf(
            'Meraki API %s failed: %s (%s)',
            $what,
            $res->status(),
            $res->body()
        );
        throw new RuntimeException($msg);
    }
}
