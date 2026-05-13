using Ithembahealth.PWA.Unified.Auth;
using Ithembahealth.PWA.Unified.Contracts;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;
using System.Security.Claims;

namespace Ithembahealth.PWA.Unified.Pages
{
    public partial class Index
    {

        
        [Inject]
        private AuthenticationStateProvider AuthenticationStateProvider { get; set; }

        [Inject]
        public NavigationManager NavigationManager { get; set; }

        [Inject]
        public IAuthenticationService AuthenticationService { get; set; }

        protected async override Task OnInitializedAsync()
        {
           var state=  await ((CookieAuthenticationStateProvider)AuthenticationStateProvider).GetAuthenticationStateAsync();
            var user = state.User;

            if (user.Identity?.IsAuthenticated == true )
            {
                var role = user.FindFirst(ClaimTypes.Role)?.Value?.ToLowerInvariant();
                if (!string.IsNullOrWhiteSpace(role))
                {
                    NavigationManager.NavigateTo($"/{role}/home", forceLoad: true);
                }
            }
           
        }



    }
}
