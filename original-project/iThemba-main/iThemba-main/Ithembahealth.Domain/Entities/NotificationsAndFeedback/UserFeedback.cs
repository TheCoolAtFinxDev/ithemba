using Ithembahealth.Domain.Common;
using System;

namespace Ithembahealth.Domain.Entities.Support
{
    public class UserFeedback : AuditableEntity
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public int Rating { get; set; } // 1–5 scale
        public string? Comment { get; set; }

        public string FeedbackType { get; set; } = "General"; // UI, Feature, Bug, Experience
    }
}
