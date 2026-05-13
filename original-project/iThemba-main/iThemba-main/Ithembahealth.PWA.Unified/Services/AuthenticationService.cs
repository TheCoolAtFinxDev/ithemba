using Ithembahealth.PWA.Unified.Auth;
using Ithembahealth.PWA.Unified.Contracts;
using Ithembahealth.PWA.Unified.Services.Base;
using Ithembahealth.PWA.Unified.ViewModels;

namespace Ithembahealth.PWA.Unified.Services
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly CookieAuthenticationStateProvider _cookieAuthenticationStateProvider;

        public AuthenticationService(CookieAuthenticationStateProvider cookieAuthenticationStateProvider)
        {
            _cookieAuthenticationStateProvider = cookieAuthenticationStateProvider;
        }

        public async Task<ApiResponse> Login(string email, string password)
        {
            return await _cookieAuthenticationStateProvider.Login(email, password);
        }

        public async Task<ApiResponse> Register(RegisterViewModel newUser)
        {
            return await _cookieAuthenticationStateProvider.Register(newUser);
        }

        public async Task Logout()
        {
            await _cookieAuthenticationStateProvider.Logout();
        }
    }
}
