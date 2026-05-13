using Ithembahealth.PWA.Unified.Contracts;
using Ithembahealth.PWA.Unified.ViewModels;
using Microsoft.AspNetCore.Components;

namespace Ithembahealth.PWA.Unified.Pages.AuthPages
{
    public partial class Register
    {
        private bool _isLoading;
        public string Message { get; set; } = "";

        public RegisterViewModel RegisterViewModel { get; set; } = new();

        public bool AcceptedUsage { get; set; } = false;
        public bool AcceptedTerms { get; set; } = false;

        [Inject]
        public NavigationManager NavigationManager { get; set; }

        [Inject]
        private IAuthenticationService AuthenticationService { get; set; }

        private async Task HandleValidSubmit()
        {
            await Task.Yield(); // allow checkbox state to flush

            if (!AcceptedUsage || !AcceptedTerms)
            {
                Message = "You must accept the Usage Policy and Terms & Conditions to continue.";
                return;
            }

            _isLoading = true;
            Message = "";

            var response = await AuthenticationService.Register(RegisterViewModel);
            _isLoading = false;

            if (response.Success)
            {
                NavigationManager.NavigateTo("/login");
            }
            else
            {
                Message = response?.ValidationErrors ?? "Registration failed.";
            }
        }

    }
}
