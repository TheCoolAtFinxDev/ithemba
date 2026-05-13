window.checkForUpdate = async () => {
    if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
            await reg.update(); // Ask SW to check for updates
            if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                return true;
            }
        }
    }
    return false;
};
