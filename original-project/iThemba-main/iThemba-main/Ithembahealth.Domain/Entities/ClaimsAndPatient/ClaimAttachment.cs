using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.ClaimsAndPatient
{
    public class ClaimAttachment : AuditableEntity
    {
        public Guid Id { get; set; }
        public Guid ProviderClaimId { get; set; }
        public string FileUrl { get; set; } = "";
        public string FileType { get; set; } = ""; // e.g., "PDF", "Image"

        public virtual ProviderClaim ProviderClaim { get; set; } = default!;
    }
}
