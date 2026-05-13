using System.Net.Http;
using Ithembahealth.PWA.Unified.Services;

namespace Ithembahealth.PWA.Unified.Middleware;

public class NetworkAwareHandler : DelegatingHandler
{
    private readonly NetworkService _net;
    public NetworkAwareHandler(NetworkService net) => _net = net;

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        try
        {
            var resp = await base.SendAsync(request, ct);
            _net.MarkOnlineFromHttp(); // any response means “we can reach the network”
            return resp;
        }
        catch (HttpRequestException)
        {
            _net.MarkOfflineFromHttp();
            throw;
        }
        catch (TaskCanceledException)
        {
            // timeout treated as connectivity issue
            _net.MarkOfflineFromHttp();
            throw;
        }
    }
}
