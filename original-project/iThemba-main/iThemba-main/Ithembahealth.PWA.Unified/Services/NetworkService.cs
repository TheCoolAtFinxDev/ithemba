using Microsoft.JSInterop;
using MudBlazor;
using System.Net.Http;

namespace Ithembahealth.PWA.Unified.Services;

public class NetworkService : IAsyncDisposable
{
    private readonly IJSRuntime _js;
    private readonly ISnackbar _snack;
    private readonly IHttpClientFactory _httpFactory;
    private DotNetObjectReference<NetworkService>? _selfRef;

    public bool IsOnline { get; private set; } = true;

    public NetworkService(IJSRuntime js, ISnackbar snack, IHttpClientFactory httpFactory)
    {
        _js = js; _snack = snack; _httpFactory = httpFactory;
    }

    public async Task InitializeAsync()
    {
        _selfRef = DotNetObjectReference.Create(this);
        await _js.InvokeVoidAsync("initNetworkInterop", _selfRef);
    }

    [JSInvokable]
    public void OnBrowserOnlineChanged(bool online)
    {
        IsOnline = online;
        _snack.Clear();
        if (!online)
        {
            _snack.Add("You’re offline. Some actions won’t work.", Severity.Warning, cfg =>
            {
                cfg.RequireInteraction = true;     // sticky until back online / retry
                cfg.Action = "Retry";
                cfg.OnClick = async _ => await RetryPingAsync();
            });
        }
        else
        {
            _snack.Add("Back online ✅", Severity.Success, cfg =>
            {
                cfg.VisibleStateDuration = 2500;
            });
        }
    }

    // Called by HTTP handler on network failures
    public void MarkOfflineFromHttp()
    {
        if (IsOnline)
        {
            OnBrowserOnlineChanged(false);
        }
    }

    public void MarkOnlineFromHttp()
    {
        if (!IsOnline)
        {
            OnBrowserOnlineChanged(true);
        }
    }

    private async Task RetryPingAsync()
    {
        try
        {
            // Use a small, always-present asset; cache-bust to avoid SW cache
            var http = _httpFactory.CreateClient("Default");
            var res = await http.GetAsync("favicon.ico?ts=" + DateTimeOffset.UtcNow.ToUnixTimeSeconds());
            if (res.IsSuccessStatusCode) OnBrowserOnlineChanged(true);
        }
        catch
        {
            // still offline; leave toast up
        }
    }

    public ValueTask DisposeAsync()
    {
        _selfRef?.Dispose();
        return ValueTask.CompletedTask;
    }
}
