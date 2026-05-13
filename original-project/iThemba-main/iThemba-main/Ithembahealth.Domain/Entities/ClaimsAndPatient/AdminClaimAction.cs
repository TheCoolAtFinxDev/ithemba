using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.ClaimsAndPatient
{
    public class AdminClaimAction : AuditableEntity
    {
        public Guid Id { get; set; }
        public Guid ProviderClaimId { get; set; }
        public string ActionType { get; set; } = ""; // "Viewed", "Edited", "Approved", etc.
        public string PerformedBy { get; set; } = "";
        public DateTime Timestamp { get; set; }

        public virtual ProviderClaim ProviderClaim { get; set; } = default!;
    }
}
