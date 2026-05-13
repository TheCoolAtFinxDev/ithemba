using Ithembahealth.Domain.Common;
using Ithembahealth.Domain.Entities.PatientAndProvider;
using System;

namespace Ithembahealth.Domain.Entities.HealthSavings
{
    public class MPesaOTPVerification : AuditableEntity
    {
        public Guid Id { get; set; }

        public Guid PatientId { get; set; }
        public virtual Patient Patient { get; set; } = default!;

        public string PhoneNumber { get; set; } = string.Empty;
        public string OTP { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public bool IsVerified => VerifiedAt.HasValue;

        public string Purpose { get; set; } = ""; // e.g., "ClaimSubmission", "AutoDebitSetup"
    }
}
