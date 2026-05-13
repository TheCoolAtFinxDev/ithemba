using Ithembahealth.Domain.Common;
using Ithembahealth.Domain.Entities.HealthSavings;
using Ithembahealth.Domain.Entities.PatientAndProvider;

namespace Ithembahealth.Domain.Entities.ClaimsAndPatient
{
    public class ProviderClaim : AuditableEntity
    {
        public Guid Id { get; set; }

        // Foreign Keys
        public Guid HealthSavingsAccountId { get; set; }
        public virtual HealthSavingsAccount HealthSavingsAccount { get; set; } = default!;

        public Guid ProviderId { get; set; }
        public virtual Provider Provider { get; set; } = default!;

        // Claim Info
        public DateTime DateOfVisit { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; } = "";
        public string Status { get; set; } = "Pending"; // e.g. Pending, Approved, Rejected

        public string? AttachmentUrl { get; set; }

        // Beneficiary Info
        public string BeneficiaryName { get; set; } = "";
        public string? RelationshipToPatient { get; set; }

        // Admin Review
        public DateTime? DecisionTimestamp { get; set; }
        public string? ApprovedBy { get; set; }
        public string? AdminNotes { get; set; }

        // Linked transaction (optional)
        public Guid? LinkedTransactionId { get; set; }
        public virtual SavingsTransaction? LinkedTransaction { get; set; }
    }
}
