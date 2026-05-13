using Ithembahealth.Domain.Common;
using System;

namespace Ithembahealth.Domain.Entities.Communication
{
    public class Notification : AuditableEntity
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public string Title { get; set; } = "";
        public string Message { get; set; } = "";
        public bool IsRead { get; set; } = false;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public string Type { get; set; } = ""; // e.g., Info, Alert, Reminder
    }
}
