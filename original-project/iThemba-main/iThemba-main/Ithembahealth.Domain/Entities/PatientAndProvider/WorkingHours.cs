using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.PatientAndProvider
{
    public class WorkingHours : AuditableEntity
    {
        public Guid WorkingHoursId { get; set; }

        public Guid ProviderId { get; set; }
        public virtual Provider Provider { get; set; } = default!;

        public DayOfWeek DayOfWeek { get; set; }

        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }

        public bool IsAvailable { get; set; } = true;
    }
}
