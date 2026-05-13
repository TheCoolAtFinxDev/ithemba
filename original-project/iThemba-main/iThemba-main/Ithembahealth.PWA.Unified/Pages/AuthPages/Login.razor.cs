using Ithembahealth.PWA.Unified.Auth;
using Ithembahealth.PWA.Unified.Contracts;
using Ithembahealth.PWA.Unified.Services;
using Ithembahealth.PWA.Unified.ViewModels;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.WebUtilities;
using System.Security.Claims;

namespace Ithembahealth.PWA.Unified.Pages.AuthPages
{
    public partial class Login
    {
        public LoginViewModel LoginViewModel { get; set; } = new();

        [Inject] public NavigationManager NavigationManager { get; set; }
        [Inject] private IAuthenticationService AuthenticationService { get; set; }
        [Inject] private AuthenticationStateProvider AuthenticationStateProvider { get; set; }

        public string Message { get; set; } = string.Empty;
        private bool _isLoading = false;
        private string? _returnUrl;

        protected override void OnInitialized()
        {
            var uri = new Uri(NavigationManager.Uri);
            var query = QueryHelpers.ParseQuery(uri.Query);

            if (query.TryGetValue("returnUrl", out var returnUrlValue) &&
                !string.IsNullOrWhiteSpace(returnUrlValue) &&
                returnUrlValue.ToString().StartsWith("/"))
            {
                _returnUrl = returnUrlValue;
            }
        }

        private async Task HandleValidSubmit()
        {
            _isLoading = true;

            var result = await AuthenticationService.Login(LoginViewModel.Email, LoginViewModel.Password);

            if (!result.Success)
            {
                Message = result.ValidationErrors ?? "Invalid login credentials.";
                _isLoading = false;
                return;
            }

            await Task.Delay(300);
            _isLoading = false;

            var authState = await ((CookieAuthenticationStateProvider)AuthenticationStateProvider).GetAuthenticationStateAsync();
            var user = authState.User;

            if (user.Identity?.IsAuthenticated != true)
            {
                Message = "Login succeeded but user is not authenticated.";
                return;
            }
            // 🔍 LOG ALL CLAIMS
            Console.WriteLine("Authenticated user claims:");
            foreach (var claim in user.Claims)
            {
                Console.WriteLine($" - {claim.Type}: {claim.Value}");
            }

            // 🔍 Log role separately
            var logrole = user.FindFirst(ClaimTypes.Role)?.Value;
            Console.WriteLine($"User role: {logrole}");
            if (!string.IsNullOrWhiteSpace(_returnUrl))
            {
                NavigationManager.NavigateTo(_returnUrl, forceLoad: true);
                return;
            }

            var role = user.FindFirst(ClaimTypes.Role)?.Value?.ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(role))
            {
                NavigationManager.NavigateTo($"/{role}/home", forceLoad: true);
            }
            else
            {
                Message = "Unable to determine user role. Please contact support.";
            }
        }
    }
}
