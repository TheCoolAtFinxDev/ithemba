using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Identity.Data
{
    public class ExtendedInfoResponse
    {
            public string Email { get; set; } = default!;
            public bool IsEmailConfirmed { get; set; }
            public string Role { get; set; } = string.Empty; 
    }
}
