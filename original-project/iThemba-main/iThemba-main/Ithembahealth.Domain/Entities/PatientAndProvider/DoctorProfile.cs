using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.PatientAndProvider
{
    public class DoctorProfile : AuditableEntity
    {
        public Guid DoctorProfileId { get; set; }

        public Guid ProviderId { get; set; }
        public Provider Provider { get; set; } = default!;

        public string Qualifications { get; set; } = "";
        public string LicenseNumber { get; set; } = "";
        public string Bio { get; set; } = "";
        public int YearsOfExperience { get; set; }

        public string ContactNumber { get; set; } = "";
        public string Location { get; set; } = "";

        public bool IsPublicProfile { get; set; } = true;
    }
}
