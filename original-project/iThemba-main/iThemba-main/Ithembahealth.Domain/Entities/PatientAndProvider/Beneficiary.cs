using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.PatientAndProvider
{
    public class Beneficiary : AuditableEntity
    {
        public Guid BeneficiaryId { get; set; }

        public Guid PatientId { get; set; }
        public Patient Patient { get; set; } = default!;

        public string FullName { get; set; } = "";
        public DateTime DateOfBirth { get; set; }
        public string Relationship { get; set; } = ""; // e.g. Child, Spouse
        public string PhoneNumber { get; set; } = "";
        public string Gender { get; set; } = "";
        public string? NationalIdNumber { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
