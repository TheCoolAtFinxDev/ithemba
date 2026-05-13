using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Identity.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public string ClinicName { get; set; } = string.Empty;
        public string MedicalLicenseNumber { get; set; } = string.Empty;

    }
}
