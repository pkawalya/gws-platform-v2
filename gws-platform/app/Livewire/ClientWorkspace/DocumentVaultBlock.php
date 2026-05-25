<?php

namespace App\Livewire\ClientWorkspace;

use App\Models\Client;
use App\Models\ClientDocument;
use App\Services\EventStore;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Attributes\Validate;
use Livewire\Component;
use Livewire\WithFileUploads;

/**
 * DocumentVaultBlock — Client Workspace document management component.
 *
 * Provides a document vault for a client with upload, verification,
 * rejection, and deletion capabilities. Supports filtering by document
 * type and tracks document type counts for the filter bar.
 */
class DocumentVaultBlock extends Component
{
    use WithFileUploads;

    #[Locked]
    public int $clientId;

    #[Validate('required|string|max:255')]
    public string $uploadTitle = '';

    #[Validate('required|string')]
    public string $uploadDocumentType = 'other';

    #[Validate('required|file|max:10240')] // 10MB max
    public $uploadFile = null;

    #[Validate('nullable|string')]
    public ?string $uploadDescription = null;

    #[Validate('nullable|date')]
    public ?string $uploadDocumentDate = null;

    #[Validate('nullable|boolean')]
    public bool $uploadIsConfidential = false;

    public string $filterType = 'all';

    /**
     * Get client documents, optionally filtered by type.
     */
    #[Computed]
    public function documents()
    {
        $query = ClientDocument::where('client_id', $this->clientId)
            ->with(['uploadedBy', 'verifiedBy', 'surveyProject']);

        if ($this->filterType !== 'all') {
            $query->where('document_type', $this->filterType);
        }

        return $query->orderByDesc('created_at')
            ->limit(50)
            ->get();
    }

    /**
     * Get document type counts for the filter bar.
     */
    #[Computed]
    public function documentTypeCounts(): array
    {
        $counts = ClientDocument::where('client_id', $this->clientId)
            ->selectRaw('document_type, COUNT(*) as count')
            ->groupBy('document_type')
            ->pluck('count', 'document_type')
            ->toArray();

        $counts['all'] = array_sum($counts);

        return $counts;
    }

    /**
     * Upload a new document.
     */
    public function uploadDocument(): void
    {
        $this->validate();

        $client = Client::find($this->clientId);
        $file = $this->uploadFile;

        // Store file
        $path = $file->store("clients/{$this->clientId}/documents", 'private');

        $document = ClientDocument::create([
            'client_id' => $this->clientId,
            'document_type' => $this->uploadDocumentType,
            'title' => $this->uploadTitle,
            'description' => $this->uploadDescription,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'status' => 'uploaded',
            'is_confidential' => $this->uploadIsConfidential,
            'document_date' => $this->uploadDocumentDate,
            'uploaded_by_user_id' => Auth::id(),
            'organization_id' => $client->organization_id,
            'branch_id' => $client->branch_id,
        ]);

        EventStore::record(
            'document.uploaded',
            $client,
            [
                'document_id' => $document->id,
                'document_type' => $document->document_type,
                'file_name' => $document->file_name,
                'file_size' => $document->file_size,
            ],
            causer: Auth::user()
        );

        // Reset form
        $this->reset(['uploadTitle', 'uploadDocumentType', 'uploadDescription',
                       'uploadDocumentDate', 'uploadIsConfidential', 'uploadFile']);
        $this->uploadDocumentType = 'other';

        unset($this->documents, $this->documentTypeCounts);

        Notification::make()
            ->title('Document Uploaded')
            ->success()
            ->body("'{$document->title}' has been uploaded successfully.")
            ->send();
    }

    /**
     * Verify a document.
     */
    public function verifyDocument(int $documentId, ?string $notes = null): void
    {
        $document = ClientDocument::where('client_id', $this->clientId)
            ->findOrFail($documentId);

        $document->markVerified(Auth::id(), $notes);

        EventStore::record(
            'document.verified',
            Client::find($this->clientId),
            [
                'document_id' => $document->id,
                'document_type' => $document->document_type,
                'verified_by' => Auth::id(),
            ],
            causer: Auth::user()
        );

        unset($this->documents);

        Notification::make()
            ->title('Document Verified')
            ->success()
            ->body("'{$document->title}' has been verified.")
            ->send();
    }

    /**
     * Reject a document.
     */
    public function rejectDocument(int $documentId, string $reason): void
    {
        $document = ClientDocument::where('client_id', $this->clientId)
            ->findOrFail($documentId);

        $document->markRejected(Auth::id(), $reason);

        EventStore::record(
            'document.rejected',
            Client::find($this->clientId),
            [
                'document_id' => $document->id,
                'rejection_reason' => $reason,
            ],
            causer: Auth::user()
        );

        unset($this->documents);

        Notification::make()
            ->title('Document Rejected')
            ->warning()
            ->body("'{$document->title}' has been rejected: {$reason}")
            ->send();
    }

    /**
     * Delete a document.
     */
    public function deleteDocument(int $documentId): void
    {
        $document = ClientDocument::where('client_id', $this->clientId)
            ->findOrFail($documentId);

        // Delete the physical file
        if (Storage::disk('private')->exists($document->file_path)) {
            Storage::disk('private')->delete($document->file_path);
        }

        $document->delete();

        EventStore::record(
            'document.deleted',
            Client::find($this->clientId),
            [
                'document_id' => $documentId,
                'document_type' => $document->document_type,
                'file_name' => $document->file_name,
            ],
            causer: Auth::user()
        );

        unset($this->documents, $this->documentTypeCounts);

        Notification::make()
            ->title('Document Deleted')
            ->success()
            ->send();
    }

    public function updatedFilterType(): void
    {
        unset($this->documents);
    }

    public function render()
    {
        return view('livewire.client-workspace.document-vault-block');
    }
}
