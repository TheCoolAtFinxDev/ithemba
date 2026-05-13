using Ithembahealth.Domain.Common;
using System;

namespace Ithembahealth.Domain.Entities.Communication
{
    public class NotificationPreferences : AuditableEntity
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public bool ReceiveEmail { get; set; } = true;
        public bool ReceiveSMS { get; set; } = false;
        public bool ReceivePush { get; set; } = true;

        public string LanguagePreference { get; set; } = "en"; // Optional
    }
}
