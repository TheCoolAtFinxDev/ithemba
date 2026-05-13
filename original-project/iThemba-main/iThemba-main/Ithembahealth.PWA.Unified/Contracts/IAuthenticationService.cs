using Ithembahealth.PWA.Unified.Services.Base;
using Ithembahealth.PWA.Unified.ViewModels;

namespace Ithembahealth.PWA.Unified.Contracts
{
    public interface IAuthenticationService
    {
        Task<ApiResponse> Login(string email, string password);
        Task<ApiResponse> Register(RegisterViewModel newUser);
        Task Logout();
    }
}
