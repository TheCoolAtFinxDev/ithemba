using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Domain.Common
{
    public class AuditableEntity
    {
            public string CreatedBy { get; set; } = string.Empty;
            public DateTime CreatedDate { get; set; }
            public string LastModifiedBy { get; set; } = string.Empty;
            public DateTime? LastModifiedDate { get; set; }
    }
}
