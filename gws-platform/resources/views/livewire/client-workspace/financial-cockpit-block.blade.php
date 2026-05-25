@php
$summary = $this->financialSummary;
$quotations = $this->quotations;
$invoices = $this->invoices;
@endphp

<div>
    {{-- Top Row: 3 Stat Cards --}}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {{-- Total Invoiced --}}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invoiced</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        UGX {{ number_format($summary['total_invoiced'] ?? 0) }}
                    </p>
                </div>
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
            </div>
        </div>

        {{-- Total Paid --}}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paid</p>
                    <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        UGX {{ number_format($summary['total_paid'] ?? 0) }}
                    </p>
                </div>
                <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>
        </div>

        {{-- Outstanding Amount --}}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding</p>
                    <p class="text-2xl font-bold {{ ($summary['total_outstanding'] ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100' }} mt-1">
                        UGX {{ number_format($summary['total_outstanding'] ?? 0) }}
                    </p>
                </div>
                <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>
        </div>
    </div>

    {{-- Collection Rate --}}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Collection Rate</p>
            <span class="text-sm font-bold {{ ($summary['collection_rate'] ?? 0) >= 80 ? 'text-green-600 dark:text-green-400' : (($summary['collection_rate'] ?? 0) >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400') }}">
                {{ number_format($summary['collection_rate'] ?? 0, 1) }}%
            </span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
            <div class="h-3 rounded-full transition-all duration-500 {{ ($summary['collection_rate'] ?? 0) >= 80 ? 'bg-green-500' : (($summary['collection_rate'] ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500') }}"
                 style="width: {{ min($summary['collection_rate'] ?? 0, 100) }}%">
            </div>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            UGX {{ number_format($summary['total_paid'] ?? 0) }} collected of UGX {{ number_format($summary['total_invoiced'] ?? 0) }} invoiced
        </p>
    </div>

    {{-- Overdue Alert --}}
    @if(($summary['overdue_count'] ?? 0) > 0)
        <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div class="flex items-start">
                <svg class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <div>
                    <h3 class="text-sm font-semibold text-red-800 dark:text-red-300">Overdue Invoices</h3>
                    <p class="text-sm text-red-700 dark:text-red-400 mt-1">
                        {{ $summary['overdue_count'] }} invoice(s) are past their due date. Please follow up on outstanding payments.
                    </p>
                </div>
            </div>
        </div>
    @endif

    {{-- Quotations Table --}}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Quotations</h3>
        </div>

        @forelse($quotations as $quotation)
            @php
                $statusColor = match($quotation->status) {
                    'draft' => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
                    'sent' => 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    'accepted' => 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    'rejected' => 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    'expired' => 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    default => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
                };
            @endphp

            <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {{ $quotation->quotation_number ?? 'QT-' . str_pad($quotation->id, 4, '0', STR_PAD_LEFT) }}
                        </p>
                        <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {{ $statusColor }}">
                            {{ ucfirst($quotation->status) }}
                        </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {{ $quotation->title ?? $quotation->description ?? 'No description' }}
                        &middot; {{ $quotation->created_at->format('M j, Y') }}
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        UGX {{ number_format($quotation->total_amount ?? 0) }}
                    </span>
                    @if($quotation->status === 'sent')
                        <button wire:click="acceptQuotation({{ $quotation->id }})"
                            wire:confirm="Accept this quotation?"
                            class="text-xs px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                            Accept
                        </button>
                    @endif
                </div>
            </div>
        @empty
            <div class="text-center py-8">
                <div class="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <svg class="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">No quotations yet</p>
            </div>
        @endforelse
    </div>

    {{-- Invoices Table --}}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoices</h3>
        </div>

        @forelse($invoices as $invoice)
            @php
                $invoiceStatusColor = match($invoice->status) {
                    'draft' => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
                    'sent' => 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    'paid' => 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    'partial' => 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    'overdue' => 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    'cancelled' => 'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400',
                    default => 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
                };
                $paidAmount = $invoice->amount_paid ?? 0;
                $totalAmount = $invoice->total_amount ?? 1;
                $paymentProgress = $totalAmount > 0 ? ($paidAmount / $totalAmount) * 100 : 0;
            @endphp

            <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {{ $invoice->invoice_number ?? 'INV-' . str_pad($invoice->id, 4, '0', STR_PAD_LEFT) }}
                            </p>
                            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {{ $invoiceStatusColor }}">
                                {{ ucfirst($invoice->status) }}
                            </span>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {{ $invoice->title ?? $invoice->description ?? 'No description' }}
                            @if($invoice->due_date)
                                &middot; Due: {{ $invoice->due_date->format('M j, Y') }}
                            @endif
                        </p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            UGX {{ number_format($totalAmount) }}
                        </span>
                        @if(in_array($invoice->status, ['sent', 'partial', 'overdue']))
                            <button wire:click="$set('selectedInvoiceId', {{ $invoice->id }})"
                                class="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                                Record Payment
                            </button>
                        @endif
                    </div>
                </div>

                {{-- Payment Progress Bar --}}
                @if($paymentProgress > 0)
                    <div class="mt-2">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                UGX {{ number_format($paidAmount) }} paid
                            </span>
                            <span class="text-xs font-medium {{ $paymentProgress >= 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400' }}">
                                {{ number_format($paymentProgress, 0) }}%
                            </span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div class="h-2 rounded-full transition-all duration-500 {{ $paymentProgress >= 100 ? 'bg-green-500' : 'bg-blue-500' }}"
                                 style="width: {{ min($paymentProgress, 100) }}%">
                            </div>
                        </div>
                    </div>
                @endif
            </div>
        @empty
            <div class="text-center py-8">
                <div class="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <svg class="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">No invoices yet</p>
            </div>
        @endforelse
    </div>

    {{-- Record Payment Modal --}}
    @if($selectedInvoiceId ?? null)
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" wire:click="$set('selectedInvoiceId', null)">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4" wire:click.stop>
                <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Record Payment</h3>
                </div>
                <div class="p-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (UGX)</label>
                        <input type="number" wire:model="paymentAmount"
                            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter payment amount" />
                    </div>
                    @if($errors->has('paymentAmount'))
                        <p class="text-sm text-red-600 dark:text-red-400">{{ $errors->first('paymentAmount') }}</p>
                    @endif
                    <div class="flex justify-end gap-2">
                        <button wire:click="$set('selectedInvoiceId', null)"
                            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                            Cancel
                        </button>
                        <button wire:click="recordPayment()"
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            Record Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    @endif
</div>
