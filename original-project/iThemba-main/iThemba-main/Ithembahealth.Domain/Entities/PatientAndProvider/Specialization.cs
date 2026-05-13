using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.PatientAndProvider
{
    public class Specialization : AuditableEntity
    {
        public Guid SpecializationId { get; set; }

        public string Name { get; set; } = "";
        public string? Description { get; set; }

        public Guid ProviderId { get; set; }
        public virtual Provider Provider { get; set; } = default!;
    }
}
