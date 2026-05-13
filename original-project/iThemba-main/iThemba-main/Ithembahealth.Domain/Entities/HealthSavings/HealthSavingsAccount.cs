using Ithembahealth.Domain.Common;
using Ithembahealth.Domain.Entities.ClaimsAndPatient;
using Ithembahealth.Domain.Entities.PatientAndProvider;

namespace Ithembahealth.Domain.Entities.HealthSavings
{
    public class HealthSavingsAccount : AuditableEntity
    {
        public Guid Id { get; set; }

        // Foreign Key
        public Guid PatientId { get; set; }
        public virtual Patient Patient { get; set; } = default!;

        // Balance and Transactions
        public decimal Balance { get; set; } = 0m;
        public decimal TotalContributed { get; set; } = 0m;
        public decimal TotalClaimed { get; set; } = 0m;

        // Preferences
        public bool AutoDebitEnabled { get; set; }
        public string? DebitSourceMpesaNumber { get; set; }

        // Relationships
        public virtual ICollection<SavingsTransaction> Transactions { get; set; } = new List<SavingsTransaction>();
        public virtual ICollection<ProviderClaim> ProviderClaims { get; set; } = new List<ProviderClaim>();
    }
}
