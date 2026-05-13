using System.ComponentModel.DataAnnotations;

namespace Ithembahealth.PWA.Unified.ViewModels
{
    public class RegisterViewModel
    {
        [Required, EmailAddress]
        public string Email { get; set; }

        [Required, MinLength(6)]
        public string Password { get; set; }

        [Required, Compare(nameof(Password), ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; }
        [Required(ErrorMessage = "Please select a role.")]
        public string Role { get; set; } = "patient"; // default role
        // Provider-specific fields
        public string FullName { get; set; } = string.Empty;
        public string ClinicName { get; set; } = string.Empty;
        public string MedicalLicenseNumber { get; set; } = string.Empty;
    }

}
