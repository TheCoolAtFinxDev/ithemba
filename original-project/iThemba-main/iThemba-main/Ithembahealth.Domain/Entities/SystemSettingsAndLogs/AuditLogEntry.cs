using Ithembahealth.Domain.Common;
using System;

namespace Ithembahealth.Domain.Entities.Logging
{
    public class AuditLogEntry : AuditableEntity
    {
        public Guid Id { get; set; }

        public string EntityName { get; set; } = "";
        public Guid EntityId { get; set; }

        public string Action { get; set; } = ""; // Created, Updated, Deleted
        public string PerformedBy { get; set; } = "";
        public string? Changes { get; set; } // JSON blob or diff string
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
