<?php

namespace App\Livewire\ClientWorkspace;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Services\EventStore;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;

/**
 * FinancialCockpitBlock — Client Workspace financial overview component.
 *
 * Displays a financial dashboard for a client including quotations,
 * invoices, payment tracking, and collection rate metrics.
 * Supports inline payment recording and quotation acceptance.
 */
class FinancialCockpitBlock extends Component
{
    #[Locked]
    public int $clientId;

    public ?int $selectedInvoiceId = null;

    #[Validate('required|numeric|min:0.01')]
    public ?float $paymentAmount = null;

    /**
     * Get the client's quotations.
     */
    #[Computed]
    public function quotations()
    {
        return Quotation::where('client_id', $this->clientId)
            ->with(['surveyProject', 'createdBy'])
            ->orderByDesc('quotation_date')
            ->limit(20)
            ->get();
    }

    /**
     * Get the client's invoices.
     */
    #[Computed]
    public function invoices()
    {
        return Invoice::where('client_id', $this->clientId)
            ->with(['surveyProject', 'quotation', 'createdBy'])
            ->orderByDesc('invoice_date')
            ->limit(20)
            ->get();
    }

    /**
     * Get financial summary stats.
     */
    #[Computed]
    public function financialSummary(): array
    {
        $client = Client::find($this->clientId);

        $totalQuoted = Quotation::where('client_id', $this->clientId)
            ->whereIn('status', ['sent', 'accepted'])
            ->sum('total_amount');

        $totalInvoiced = Invoice::where('client_id', $this->clientId)
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('total_amount');

        $totalPaid = Invoice::where('client_id', $this->clientId)
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->sum('amount_paid');

        $totalOutstanding = Invoice::where('client_id', $this->clientId)
            ->whereNotIn('status', ['cancelled', 'draft', 'paid'])
            ->sum('amount_due');

        $overdueCount = Invoice::where('client_id', $this->clientId)
            ->where('status', 'overdue')
            ->count();

        return [
            'total_quoted' => (float) $totalQuoted,
            'total_invoiced' => (float) $totalInvoiced,
            'total_paid' => (float) $totalPaid,
            'total_outstanding' => (float) $totalOutstanding,
            'overdue_count' => $overdueCount,
            'collection_rate' => $totalInvoiced > 0
                ? round(($totalPaid / $totalInvoiced) * 100, 1)
                : 0,
        ];
    }

    /**
     * Record a payment against the selected invoice.
     */
    public function recordPayment(): void
    {
        $this->validate([
            'paymentAmount' => 'required|numeric|min:0.01',
        ]);

        $invoice = Invoice::where('client_id', $this->clientId)
            ->findOrFail($this->selectedInvoiceId);

        $invoice->recordPayment($this->paymentAmount);

        EventStore::record(
            'invoice.payment_recorded',
            Client::find($this->clientId),
            [
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'payment_amount' => $this->paymentAmount,
                'new_status' => $invoice->fresh()->status,
            ],
            causer: Auth::user()
        );

        activity()
            ->performedOn($invoice)
            ->causedBy(Auth::user())
            ->withProperties(['amount' => $this->paymentAmount])
            ->log("Payment of UGX " . number_format($this->paymentAmount) . " recorded for invoice {$invoice->invoice_number}");

        // Reset modal and refresh data
        $this->selectedInvoiceId = null;
        $this->paymentAmount = null;
        unset($this->invoices, $this->financialSummary);

        Notification::make()
            ->title('Payment Recorded')
            ->success()
            ->body("UGX " . number_format($this->paymentAmount) . " recorded against {$invoice->invoice_number}")
            ->send();
    }

    /**
     * Mark a quotation as accepted.
     */
    public function acceptQuotation(int $quotationId): void
    {
        $quotation = Quotation::where('client_id', $this->clientId)
            ->findOrFail($quotationId);

        $quotation->markAs('accepted');

        EventStore::record(
            'quotation.accepted',
            Client::find($this->clientId),
            [
                'quotation_id' => $quotation->id,
                'quotation_number' => $quotation->quotation_number,
                'total_amount' => $quotation->total_amount,
            ],
            causer: Auth::user()
        );

        unset($this->quotations, $this->financialSummary);

        Notification::make()
            ->title('Quotation Accepted')
            ->success()
            ->body("Quotation {$quotation->quotation_number} has been accepted.")
            ->send();
    }

    public function render()
    {
        return view('livewire.client-workspace.financial-cockpit-block');
    }
}
