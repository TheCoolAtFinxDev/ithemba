using System;

namespace Ithembahealth.PWA.Unified.Services
{
    public class UserSessionService
    {
        public string Email { get; set; }
        public string Token { get; set; }
        public string Role { get; set; } // New property to track user role

        public bool IsAuthenticated => !string.IsNullOrEmpty(Token);

        public void Logout()
        {
            Email = null;
            Token = null;
            Role = null; // Clear role on logout
        }
    }
}
