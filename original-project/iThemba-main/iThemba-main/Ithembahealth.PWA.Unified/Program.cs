    using Blazored.LocalStorage;
    using Ithembahealth.PWA.Unified;
    using Ithembahealth.PWA.Unified.Auth;
    using Ithembahealth.PWA.Unified.Contracts;
    using Ithembahealth.PWA.Unified.Middleware;
    using Ithembahealth.PWA.Unified.Services;
    using Microsoft.AspNetCore.Components.Authorization;
    using Microsoft.AspNetCore.Components.Web;
    using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
    using MudBlazor;
    using MudBlazor.Services;

    var builder = WebAssemblyHostBuilder.CreateDefault(args);
    builder.RootComponents.Add<App>("#app");
    builder.RootComponents.Add<HeadOutlet>("head::after");

    builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
    builder.Services.AddBlazoredLocalStorage();

    builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
    builder.Services.AddScoped<CookieHandler>();
    builder.Services.AddAuthorizationCore();
    builder.Services.AddScoped<AuthenticationStateProvider, CookieAuthenticationStateProvider>();
    builder.Services.AddTransient<CookieAuthenticationStateProvider>();

    builder.Services.AddHttpClient<IClient, Client>(client => client.BaseAddress = new Uri("https://ithembahealthapi20250809161751.azurewebsites.net"))
        .AddHttpMessageHandler<CookieHandler>()
.AddHttpMessageHandler<NetworkAwareHandler>();


builder.Services.AddHttpClient(
        "Authentication",
        client => client.BaseAddress = new Uri("https://ithembahealthapi20250809161751.azurewebsites.net"))
        .AddHttpMessageHandler<CookieHandler>()
.AddHttpMessageHandler<NetworkAwareHandler>();

builder.Services.AddTransient<CookieHandler>();
builder.Services.AddTransient<NetworkAwareHandler>();

builder.Services.AddHttpClient(
        "Default",
        client => 
        { 
            client.BaseAddress = new Uri(builder.HostEnvironment.BaseAddress); 
            client.Timeout = TimeSpan.FromSeconds(15);
        })
        .AddHttpMessageHandler<NetworkAwareHandler>();
// Map the default HttpClient injection to the named client above
builder.Services.AddScoped(sp => sp.GetRequiredService<IHttpClientFactory>().CreateClient("Default"));

builder.Services.AddSingleton<UserSessionService>();
    builder.Services.AddScoped<LoaderService>();
    builder.Services.AddScoped<IUpdateService, UpdateService>();
    builder.Services.AddScoped<NetworkService>();


builder.Services.AddMudServices(cfg =>
{
    cfg.SnackbarConfiguration.PositionClass = Defaults.Classes.Position.BottomCenter;
    cfg.SnackbarConfiguration.PreventDuplicates = true;
    cfg.SnackbarConfiguration.NewestOnTop = false;
    cfg.SnackbarConfiguration.ShowCloseIcon = true;
    cfg.SnackbarConfiguration.MaxDisplayedSnackbars = 2;
});
await builder.Build().RunAsync();
