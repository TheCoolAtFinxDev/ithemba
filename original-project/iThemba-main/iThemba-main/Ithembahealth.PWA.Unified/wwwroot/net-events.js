// wwwroot/net-events.js
(function () {
    function notify(dotnetRef, online) {
        dotnetRef.invokeMethodAsync('OnBrowserOnlineChanged', online);
    }

    window.initNetworkInterop = function (dotnetRef) {
        notify(dotnetRef, navigator.onLine);
        addEventListener('online', () => notify(dotnetRef, true));
        addEventListener('offline', () => notify(dotnetRef, false));
    };
})();
