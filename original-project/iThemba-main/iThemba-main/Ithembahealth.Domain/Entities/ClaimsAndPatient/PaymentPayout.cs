using Ithembahealth.Domain.Common;
using Ithembahealth.Domain.Entities.PatientAndProvider;

namespace Ithembahealth.Domain.Entities.ClaimsAndPatient
{
    public class PaymentPayout : AuditableEntity
    {
        public Guid Id { get; set; }
        public Guid ProviderClaimId { get; set; }
        public Guid ProviderId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PayoutDate { get; set; }
        public string PaymentMethod { get; set; } = ""; // "M-PESA", "Bank Transfer"

        public virtual ProviderClaim ProviderClaim { get; set; } = default!;
        public virtual Provider Provider { get; set; } = default!;
    }
}
