<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Invoice extends Model
{
    use RecordsDomainEvents;

    public const STATUSES = ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'];

    protected $fillable = [
        'invoice_number',
        'client_id',
        'quotation_id',
        'survey_project_id',
        'status',
        'invoice_date',
        'due_date',
        'subtotal',
        'tax_amount',
        'total_amount',
        'amount_paid',
        'amount_due',
        'currency',
        'line_items',
        'notes',
        'created_by_user_id',
        'organization_id',
        'branch_id',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'amount_due' => 'decimal:2',
        'line_items' => 'array',
    ];

    // Relationships
    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function quotation(): BelongsTo { return $this->belongsTo(Quotation::class); }
    public function surveyProject(): BelongsTo { return $this->belongsTo(SurveyProject::class); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by_user_id'); }
    public function organization(): BelongsTo { return $this->belongsTo(Organization::class); }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }

    // Scopes
    public function scopeDraft($query) { return $query->where('status', 'draft'); }
    public function scopeSent($query) { return $query->where('status', 'sent'); }
    public function scopePaid($query) { return $query->where('status', 'paid'); }
    public function scopeOverdue($query) { return $query->where('status', 'overdue'); }
    public function scopePartial($query) { return $query->where('status', 'partial'); }

    // Auto-generate invoice number
    protected static function booted(): void
    {
        static::creating(function (self $invoice) {
            if (empty($invoice->invoice_number)) {
                $invoice->invoice_number = static::generateInvoiceNumber();
            }
            // Auto-calculate amount_due
            if ($invoice->amount_due === null) {
                $invoice->amount_due = $invoice->total_amount - ($invoice->amount_paid ?? 0);
            }
        });
    }

    public static function generateInvoiceNumber(): string
    {
        $year = now()->year;
        $prefix = "INV-{$year}-";
        $last = static::query()->where('invoice_number', 'LIKE', "{$prefix}%")
            ->orderByDesc('invoice_number')->first();
        $next = $last ? ((int) Str::afterLast($last->invoice_number, '-')) + 1 : 1;
        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    // Business logic
    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && !in_array($this->status, ['paid', 'cancelled']);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid' || $this->amount_due <= 0;
    }

    public function paymentPercentage(): float
    {
        if ($this->total_amount <= 0) return 0;
        return round(($this->amount_paid / $this->total_amount) * 100, 2);
    }

    public function recordPayment(float $amount): void
    {
        $this->amount_paid += $amount;
        $this->amount_due = max(0, $this->total_amount - $this->amount_paid);

        if ($this->amount_due <= 0) {
            $this->status = 'paid';
        } elseif ($this->amount_paid > 0) {
            $this->status = 'partial';
        }

        $this->save();
    }
}
