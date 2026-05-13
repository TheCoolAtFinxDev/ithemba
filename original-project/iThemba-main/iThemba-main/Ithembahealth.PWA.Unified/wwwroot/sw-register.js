// wwwroot/sw-register.js
(function () {
    async function registerSW(dotnetRef) {
        if (!('serviceWorker' in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' });

            if (reg.waiting) {
                dotnetRef.invokeMethodAsync('OnSWWaiting');
            }

            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        dotnetRef.invokeMethodAsync('OnSWWaiting');
                    }
                });
            });

            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                location.reload();
            });
        } catch (e) {
            console.error('Service worker registration failed:', e);
        }
    }

    async function requestSWUpdate() {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else if (reg) {
            await reg.update();
        }
    }

    // expose as globals for JSInterop
    window.registerSW = registerSW;
    window.requestSWUpdate = requestSWUpdate;
})();
