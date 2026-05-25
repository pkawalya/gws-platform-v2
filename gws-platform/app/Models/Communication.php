<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Communication extends Model
{
    use RecordsDomainEvents;

    public const CHANNELS = ['sms', 'call', 'email', 'note', 'whatsapp', 'letter'];
    public const DIRECTIONS = ['inbound', 'outbound'];
    public const STATUSES = ['draft', 'sent', 'delivered', 'failed', 'read'];

    protected $fillable = [
        'client_id',
        'survey_project_id',
        'channel',
        'direction',
        'subject',
        'body',
        'status',
        'sender_type',
        'sender_id',
        'recipient_phone',
        'recipient_email',
        'metadata',
        'sent_at',
        'delivered_at',
        'read_at',
        'organization_id',
        'branch_id',
    ];

    protected $casts = [
        'metadata' => 'array',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    // Relationships
    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function surveyProject(): BelongsTo { return $this->belongsTo(SurveyProject::class); }
    public function sender(): MorphTo { return $this->morphTo(); }
    public function organization(): BelongsTo { return $this->belongsTo(Organization::class); }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }

    // Scopes
    public function scopeSms($query) { return $query->where('channel', 'sms'); }
    public function scopeCall($query) { return $query->where('channel', 'call'); }
    public function scopeEmail($query) { return $query->where('channel', 'email'); }
    public function scopeNote($query) { return $query->where('channel', 'note'); }
    public function scopeInbound($query) { return $query->where('direction', 'inbound'); }
    public function scopeOutbound($query) { return $query->where('direction', 'outbound'); }
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Business logic
    public function markDelivered(): void
    {
        $this->update(['status' => 'delivered', 'delivered_at' => now()]);
    }

    public function markFailed(?string $reason = null): void
    {
        $this->update([
            'status' => 'failed',
            'metadata' => array_merge($this->metadata ?? [], ['failure_reason' => $reason]),
        ]);
    }

    public function channelIcon(): string
    {
        return match($this->channel) {
            'sms' => '💬',
            'call' => '📞',
            'email' => '✉️',
            'note' => '📝',
            'whatsapp' => '📱',
            'letter' => '📄',
            default => '📋',
        };
    }

    public function channelLabel(): string
    {
        return match($this->channel) {
            'sms' => 'SMS',
            'call' => 'Phone Call',
            'email' => 'Email',
            'note' => 'Internal Note',
            'whatsapp' => 'WhatsApp',
            'letter' => 'Formal Letter',
            default => ucfirst($this->channel),
        };
    }
}
