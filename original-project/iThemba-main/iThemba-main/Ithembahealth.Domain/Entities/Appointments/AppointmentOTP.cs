using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.Appointments
{
    public class AppointmentOTP : AuditableEntity
    {
        public Guid AppointmentOtpId { get; set; }

        public Guid AppointmentId { get; set; }
        public Appointment Appointment { get; set; } = default!;

        public string OTPCode { get; set; } = "";
        public DateTime SentAt { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime? UsedAt { get; set; }
    }
}
