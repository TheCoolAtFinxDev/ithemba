using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.ClaimsAndPatient
{
    public class ClaimDecision : AuditableEntity
    {
        public Guid Id { get; set; }
        public Guid ProviderClaimId { get; set; }
        public string Decision { get; set; } = ""; // "Approved", "Rejected"
        public string ProcessedBy { get; set; } = "";
        public DateTime DecisionDate { get; set; }

        public virtual ProviderClaim ProviderClaim { get; set; } = default!;
    }
}
