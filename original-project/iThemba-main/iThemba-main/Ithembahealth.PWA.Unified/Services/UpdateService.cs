using System.Net.Http.Json;
using Microsoft.JSInterop;
using MudBlazor;

namespace Ithembahealth.PWA.Unified.Services;

public interface IUpdateService
{
    Task InitializeAsync(object dotNetVisibleComponentInstance);
    Task CheckForUpdatesAsync();
    Task ApplyUpdateAsync();
}


public class UpdateService : IUpdateService, IAsyncDisposable
{
    private readonly IJSRuntime _js;
    private readonly HttpClient _http;
    private readonly ISnackbar _snack;
    private IJSObjectReference? _swModule;
    private DotNetObjectReference<UpdateService>? _selfRef;
    private PeriodicTimer? _timer;
    private string? _currentVersion;

    public UpdateService(IJSRuntime js, HttpClient http, ISnackbar snack)
    {
        _js = js; _http = http; _snack = snack;
    }

    public async Task InitializeAsync(object dotNetVisibleComponentInstance)
    {
        _selfRef = DotNetObjectReference.Create(this);

        // Import the JS module and call exported functions on the module
        //_swModule = await _js.InvokeAsync<IJSObjectReference>("import", "/sw-register.js");
        await _js.InvokeVoidAsync("registerSW", _selfRef);

        // (optional) version.json polling — skip if you’re not using it
        _currentVersion = await GetRemoteVersionAsync();
#if DEBUG
        _timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
#else
        _timer = new PeriodicTimer(TimeSpan.FromMinutes(10));
#endif
        _ = Task.Run(async () =>
        {
            while (await _timer!.WaitForNextTickAsync())
            {
                try { await CheckForUpdatesAsync(); } catch { }
            }
        });
    }

    public async Task CheckForUpdatesAsync()
    {
        var remote = await GetRemoteVersionAsync();
        if (!string.IsNullOrWhiteSpace(remote) && remote != _currentVersion)
        {
            _currentVersion = remote;
            NotifyUpdateAvailable();
        }
        else 
        {
            await _js.InvokeVoidAsync("requestSWUpdate");
        }
    }

    public async Task ApplyUpdateAsync()
    {
            await _js.InvokeVoidAsync("requestSWUpdate");
    }

    private async Task<string?> GetRemoteVersionAsync()
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            var dto = await _http.GetFromJsonAsync<VersionDto>("version.json?" + DateTimeOffset.UtcNow.ToUnixTimeSeconds(), cts.Token);
            return dto?.Version;
        }
        catch { return null; }
    }

    private void NotifyUpdateAvailable()
    {
        _snack.Add("A new version of IthembaHealth is available.", Severity.Info, cfg =>
        {
            cfg.RequireInteraction = true;
            cfg.Action = "Reload";
            cfg.OnClick = _ => ApplyUpdateAsync();
        });
    }

    [JSInvokable] public void OnSWWaiting() => NotifyUpdateAvailable();

    public async ValueTask DisposeAsync()
    {
        _timer?.Dispose();
        _selfRef?.Dispose();
        if (_swModule is not null) await _swModule.DisposeAsync();
    }

    private record VersionDto(string Version, DateTimeOffset Built);
}