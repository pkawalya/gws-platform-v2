// GWS Platform V2 — Service Worker Registration

declare global {
  interface Window {
    __GWS_SW_REGISTERED?: boolean;
  }
}

export interface SWRegistrationResult {
  registered: boolean;
  error?: string;
}

export interface SWStatus {
  active: boolean;
  waiting: boolean;
  installing: boolean;
  controller: boolean;
}

// Register the service worker
export async function registerServiceWorker(): Promise<SWRegistrationResult> {
  // Only register in production (not during development with next dev)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SW] Skipping registration in development mode');
    return { registered: false, error: 'Development mode' };
  }

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported in this browser');
    return { registered: false, error: 'Not supported' };
  }

  // Prevent double registration
  if (window.__GWS_SW_REGISTERED) {
    return { registered: true };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    window.__GWS_SW_REGISTERED = true;
    console.log('[SW] Registered successfully:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New version available — notify the user
            console.log('[SW] New version available');
            showUpdateNotification(registration);
          } else {
            // First install — content is cached for offline use
            console.log('[SW] Content cached for offline use');
          }
        }
      });
    });

    // Listen for controlling service worker changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed — new SW took over');
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    return { registered: true };
  } catch (error: any) {
    console.error('[SW] Registration failed:', error);
    return { registered: false, error: error.message };
  }
}

// Show update notification to the user
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  // Dispatch a custom event that the app can listen to
  const event = new CustomEvent('sw-update-available', {
    detail: { registration },
  });
  window.dispatchEvent(event);
}

// Handle messages from the service worker
function handleSWMessage(event: MessageEvent) {
  const { data } = event;

  if (data.type === 'TRIGGER_SYNC') {
    // Trigger the app's sync mechanism
    window.dispatchEvent(new CustomEvent('sw-trigger-sync'));
  }

  if (data.type === 'SYNC_STARTED') {
    window.dispatchEvent(new CustomEvent('sw-sync-started'));
  }
}

// Get current service worker status
export async function getServiceWorkerStatus(): Promise<SWStatus> {
  if (!('serviceWorker' in navigator)) {
    return { active: false, waiting: false, installing: false, controller: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) {
      return { active: false, waiting: false, installing: false, controller: false };
    }

    return {
      active: registration.active !== null,
      waiting: registration.waiting !== null,
      installing: registration.installing !== null,
      controller: navigator.serviceWorker.controller !== null,
    };
  } catch {
    return { active: false, waiting: false, installing: false, controller: false };
  }
}

// Activate a waiting service worker
export async function activateUpdate(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration('/');
  if (registration?.waiting) {
    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

// Get cache storage size from the service worker
export async function getCacheStorageSize(): Promise<number> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return 0;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === 'CACHE_SIZE') {
        resolve(event.data.size);
      }
    };

    navigator.serviceWorker.controller?.postMessage(
      { type: 'GET_CACHE_SIZE' },
      [messageChannel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => resolve(0), 5000);
  });
}

// Clear all service worker caches
export async function clearSWCaches(): Promise<void> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === 'CACHES_CLEARED') {
        resolve();
      }
    };

    navigator.serviceWorker.controller?.postMessage(
      { type: 'CLEAR_CACHES' },
      [messageChannel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => resolve(), 5000);
  });
}

// Unregister the service worker
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (registration) {
      const result = await registration.unregister();
      window.__GWS_SW_REGISTERED = false;
      return result;
    }
    return false;
  } catch {
    return false;
  }
}

// PWA install prompt handling
let deferredPrompt: any = null;

export function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar
    e.preventDefault();
    deferredPrompt = e;
    console.log('[SW] Install prompt deferred');

    // Dispatch event for UI components
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('[SW] App installed');
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

export async function installPWA(): Promise<boolean> {
  if (!deferredPrompt) return false;

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch {
    return false;
  }
}

export function canInstallPWA(): boolean {
  return deferredPrompt !== null;
}

// Initialize everything
export function initServiceWorker(): void {
  if (typeof window === 'undefined') return;

  initInstallPrompt();
  registerServiceWorker();
}
