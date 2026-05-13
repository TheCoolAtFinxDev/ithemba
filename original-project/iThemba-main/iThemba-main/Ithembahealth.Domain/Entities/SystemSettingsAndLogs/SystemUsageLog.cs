using Ithembahealth.Domain.Common;
using System;

namespace Ithembahealth.Domain.Entities.SystemSettingsAndLogs
{
    public class SystemUsageLog : AuditableEntity
    {
        public Guid Id { get; set; }

        public Guid? UserId { get; set; }
        public string Action { get; set; } = ""; // e.g., Login, SubmitClaim
        public string Description { get; set; } = "";
        public string IPAddress { get; set; } = "";

        public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    }
}
