using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.PatientAndProvider
{
    public class PatientProfile : AuditableEntity
    {
        public Guid PatientProfileId { get; set; }

        public Guid PatientId { get; set; }
        public virtual Patient Patient { get; set; } = default!;

        public string NationalIdNumber { get; set; } = "";
        public string Gender { get; set; } = "";
        public DateTime DateOfBirth { get; set; }

        public string PhoneNumber { get; set; } = "";
        public string Email { get; set; } = "";
        public string Address { get; set; } = "";

        public bool IsVerified { get; set; } = false;
    }
}
