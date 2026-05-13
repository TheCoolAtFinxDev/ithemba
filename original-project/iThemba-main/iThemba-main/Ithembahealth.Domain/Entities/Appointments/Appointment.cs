using Ithembahealth.Domain.Common;
using Ithembahealth.Domain.Entities.PatientAndProvider;

namespace Ithembahealth.Domain.Entities.Appointments
{
    public class Appointment : AuditableEntity
    {
        public Guid AppointmentId { get; set; }

        public Guid PatientId { get; set; }
        public virtual Patient Patient { get; set; } = default!;

        public Guid ProviderId { get; set; }
        public virtual Provider Provider { get; set; } = default!;

        public Guid? BeneficiaryId { get; set; }
        public Beneficiary? Beneficiary { get; set; }

        public DateTime AppointmentDate { get; set; }
        public string Reason { get; set; } = "";
        public string Status { get; set; } = "Booked"; // Booked, Confirmed, Completed, Cancelled

        public bool IsConfirmedByClinic { get; set; } = false;

        // Navigation properties
        public ICollection<AppointmentNote>? Notes { get; set; } 
        public ICollection<AppointmentOTP>? OTPs { get; set; }
    }
}
