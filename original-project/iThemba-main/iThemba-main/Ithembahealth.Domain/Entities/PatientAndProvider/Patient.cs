using Ithembahealth.Domain.Common;
using Ithembahealth.Domain.Entities.Appointments;
using Ithembahealth.Domain.Entities.HealthSavings;

namespace Ithembahealth.Domain.Entities.PatientAndProvider
{
    public class Patient : AuditableEntity
    {
        public Guid PatientId { get; set; }

        // Basic Information
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string NationalId { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        // Account
        public string MpesaPhoneNumber { get; set; } = string.Empty;
        public bool IsPhoneNumberVerified { get; set; }
        public DateTime? DateOfBirth { get; set; }

        // Relationships
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<Beneficiary> Beneficiaries { get; set; } = new List<Beneficiary>();
        public HealthSavingsAccount? HealthSavingsAccount { get; set; }

        // Convenience
        public string FullName => $"{FirstName} {LastName}";
    }
}
