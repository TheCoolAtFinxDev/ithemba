using Ithembahealth.Domain.Common;
using Ithembahealth.Domain.Entities.Appointments;

namespace Ithembahealth.Domain.Entities.PatientAndProvider
{
    public class Provider : AuditableEntity
    {
        public Guid ProviderId { get; set; }

        public string ClinicName { get; set; } = "";
        public string DoctorName { get; set; } = "";
        public string Specialty { get; set; } = "";
        public string PhoneNumber { get; set; } = "";
        public string Email { get; set; } = "";
        public string Location { get; set; } = "";
        public string MpesaMerchantCode { get; set; } = "";
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsVerified { get; set; } = false;
        // ✅ Navigation Properties
        public ICollection<Specialization> ? Specializations { get; set; }
        public ICollection<WorkingHours> ? WorkingHours { get; set; } 
        public ICollection<Appointment> ? Appointments { get; set; }
    }
}