using System.Security.Claims;

namespace Ithembahealth.PWA.Unified.Auth
{
        public class UserInfo
        {
            public string Email { get; set; } = string.Empty;
            public bool IsEmailConfirmed { get; set; }
            public Dictionary<string, string> Claims { get; set; } = new();
            public string Role { get; set; }
        }
}
