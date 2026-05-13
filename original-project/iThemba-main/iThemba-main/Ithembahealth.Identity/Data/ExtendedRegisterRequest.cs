using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Identity.Data
{
    public class ExtendedRegisterRequest
    {
        [Required]
        public string Email { get; set; } = default!;

        [Required]
        public string Password { get; set; } = default!;
        public string Role { get; set; } = "Patient"; // default role
        public string FullName { get; set; } = string.Empty;
        public string ClinicName { get; set; } = string.Empty;
        public string MedicalLicenseNumber { get; set; } = string.Empty;

    }
}
