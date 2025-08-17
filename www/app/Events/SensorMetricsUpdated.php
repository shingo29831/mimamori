<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;

class SensorMetricsUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public string $homeId,
        public ?float $temperature = null,  // ← nullable
        public ?float $humidity    = null,  // ← nullable
        public ?string $timestamp  = null,
        public ?string $sensorId   = null,
    ) {}

    public function broadcastOn(): Channel
    {
        // チャンネルはプロジェクトの設計に合わせて
        return new Channel('homes.'.$this->homeId);
        // Private/Presence を使っているなら:
        // return new PrivateChannel('homes.'.$this->homeId);
    }

    public function broadcastAs(): string
    {
        return 'SensorMetricsUpdated';
    }

    public function broadcastWith(): array
    {
        // null のキーは送らない
        return array_filter([
            'homeId'      => $this->homeId,
            'sensorId'    => $this->sensorId,
            'temperature' => $this->temperature,
            'humidity'    => $this->humidity,
            'timestamp'   => $this->timestamp,
        ], fn ($v) => $v !== null);
    }
}
