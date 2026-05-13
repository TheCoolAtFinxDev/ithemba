using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.Appointments
{
    public class AppointmentStatistics : AuditableEntity
    {
        public Guid Id { get; set; }

        // Optional: you can track stats per provider or clinic
        public Guid? ProviderId { get; set; }
        public string? ProviderName { get; set; }

        // Period covered (e.g., day, week, month)
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }

        public int TotalAppointments { get; set; }
        public int ConfirmedAppointments { get; set; }
        public int CompletedAppointments { get; set; }
        public int CancelledAppointments { get; set; }
        public int NoShows { get; set; }

        // Optional: custom tag/category (e.g., "Weekly", "Monthly", "Q1", etc.)
        public string? Label { get; set; }
    }
}
