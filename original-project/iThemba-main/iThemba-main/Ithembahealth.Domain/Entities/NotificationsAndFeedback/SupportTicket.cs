using Ithembahealth.Domain.Common;
using System;

namespace Ithembahealth.Domain.Entities.Support
{
    public class SupportTicket : AuditableEntity
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string Subject { get; set; } = "";
        public string Message { get; set; } = "";
        public string Status { get; set; } = "Open"; // Open, In Progress, Resolved, Closed

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }
        public string? ResolutionNotes { get; set; }
    }
}
