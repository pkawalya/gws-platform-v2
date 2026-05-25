<?php

namespace App\Filament\Resources\Clients\Widgets;

use Filament\Widgets\Widget;

/**
 * ClientWorkspaceRedirectBanner — Deprecation banner on legacy client pages.
 *
 * Shown as a header widget on ViewClient and EditClient pages to direct
 * users toward the new ClientWorkspace page which consolidates all
 * client-centric information into a single tabbed interface.
 */
class ClientWorkspaceRedirectBanner extends Widget
{
    protected static string $view = 'filament.resources.clients.widgets.client-workspace-redirect-banner';

    protected int | string | array $columnSpan = 'full';

    public ?int $clientId = null;
}
