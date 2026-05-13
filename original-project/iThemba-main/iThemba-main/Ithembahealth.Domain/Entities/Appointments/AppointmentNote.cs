using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.Appointments
{
    public class AppointmentNote : AuditableEntity
    {
        public Guid AppointmentNoteId { get; set; }

        public Guid AppointmentId { get; set; }
        public  Appointment Appointment { get; set; } = default!;

        public string Note { get; set; } = "";
        public string AddedBy { get; set; } = ""; // e.g., "Admin", "Doctor", etc.
    }
}
