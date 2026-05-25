<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientDocument extends Model
{
    use RecordsDomainEvents;

    public const DOCUMENT_TYPES = [
        'kyc', 'title_deed', 'survey_report', 'agreement', 
        'correspondence', 'photograph', 'map', 'other'
    ];

    public const STATUSES = ['uploaded', 'verified', 'rejected', 'archived'];

    protected $fillable = [
        'client_id',
        'survey_project_id',
        'document_type',
        'title',
        'description',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'status',
        'verified_by_user_id',
        'verified_at',
        'is_confidential',
        'document_date',
        'expiry_date',
        'verification_notes',
        'uploaded_by_user_id',
        'organization_id',
        'branch_id',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'is_confidential' => 'boolean',
        'verified_at' => 'datetime',
        'document_date' => 'date',
        'expiry_date' => 'date',
    ];

    // Relationships
    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function surveyProject(): BelongsTo { return $this->belongsTo(SurveyProject::class); }
    public function verifiedBy(): BelongsTo { return $this->belongsTo(User::class, 'verified_by_user_id'); }
    public function uploadedBy(): BelongsTo { return $this->belongsTo(User::class, 'uploaded_by_user_id'); }
    public function organization(): BelongsTo { return $this->belongsTo(Organization::class); }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }

    // Scopes
    public function scopeVerified($query) { return $query->where('status', 'verified'); }
    public function scopePendingVerification($query) { return $query->where('status', 'uploaded'); }
    public function scopeRejected($query) { return $query->where('status', 'rejected'); }
    public function scopeByType($query, string $type) { return $query->where('document_type', $type); }
    public function scopeConfidential($query) { return $query->where('is_confidential', true); }
    public function scopeExpiringSoon($query, int $days = 30)
    {
        return $query->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', now()->addDays($days))
            ->where('expiry_date', '>=', now());
    }

    // Business logic
    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function isExpiringSoon(int $days = 30): bool
    {
        return $this->expiry_date 
            && $this->expiry_date->isFuture() 
            && $this->expiry_date->lessThanOrEqualTo(now()->addDays($days));
    }

    public function markVerified(int $userId, ?string $notes = null): void
    {
        $this->update([
            'status' => 'verified',
            'verified_by_user_id' => $userId,
            'verified_at' => now(),
            'verification_notes' => $notes,
        ]);
    }

    public function markRejected(int $userId, string $reason): void
    {
        $this->update([
            'status' => 'rejected',
            'verified_by_user_id' => $userId,
            'verified_at' => now(),
            'verification_notes' => $reason,
        ]);
    }

    public function fileSizeFormatted(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
        if ($bytes >= 1024) return round($bytes / 1024, 1) . ' KB';
        return $bytes . ' B';
    }

    public function documentTypeLabel(): string
    {
        return match($this->document_type) {
            'kyc' => 'KYC Document',
            'title_deed' => 'Title Deed',
            'survey_report' => 'Survey Report',
            'agreement' => 'Agreement',
            'correspondence' => 'Correspondence',
            'photograph' => 'Photograph',
            'map' => 'Map/Cadastral',
            'other' => 'Other',
            default => ucfirst(str_replace('_', ' ', $this->document_type)),
        };
    }
}
