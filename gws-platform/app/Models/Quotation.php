<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Quotation extends Model
{
    use RecordsDomainEvents;

    public const STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

    protected $fillable = [
        'quotation_number',
        'client_id',
        'survey_project_id',
        'status',
        'quotation_date',
        'valid_until',
        'subtotal',
        'tax_amount',
        'total_amount',
        'currency',
        'line_items',
        'terms_and_conditions',
        'internal_notes',
        'created_by_user_id',
        'organization_id',
        'branch_id',
    ];

    protected $casts = [
        'quotation_date' => 'date',
        'valid_until' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'line_items' => 'array',
    ];

    // Relationships
    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function surveyProject(): BelongsTo { return $this->belongsTo(SurveyProject::class); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by_user_id'); }
    public function organization(): BelongsTo { return $this->belongsTo(Organization::class); }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function invoices(): HasMany { return $this->hasMany(Invoice::class); }

    // Scopes
    public function scopeDraft($query) { return $query->where('status', 'draft'); }
    public function scopeSent($query) { return $query->where('status', 'sent'); }
    public function scopeAccepted($query) { return $query->where('status', 'accepted'); }
    public function scopeRejected($query) { return $query->where('status', 'rejected'); }
    public function scopeExpired($query) { return $query->where('status', 'expired'); }

    // Auto-generate quotation number
    protected static function booted(): void
    {
        static::creating(function (self $quotation) {
            if (empty($quotation->quotation_number)) {
                $quotation->quotation_number = static::generateQuotationNumber();
            }
        });
    }

    public static function generateQuotationNumber(): string
    {
        $year = now()->year;
        $prefix = "QUO-{$year}-";
        $last = static::query()->where('quotation_number', 'LIKE', "{$prefix}%")
            ->orderByDesc('quotation_number')->first();
        $next = $last ? ((int) Str::afterLast($last->quotation_number, '-')) + 1 : 1;
        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    // Business logic
    public function isExpired(): bool
    {
        return $this->valid_until && $this->valid_until->isPast();
    }

    public function markAs(string $status): bool
    {
        return $this->update(['status' => $status]);
    }

    public function recalculate(): void
    {
        $items = collect($this->line_items ?? []);
        $subtotal = $items->sum('total');
        $this->update([
            'subtotal' => $subtotal,
            'total_amount' => $subtotal + $this->tax_amount,
        ]);
    }
}
