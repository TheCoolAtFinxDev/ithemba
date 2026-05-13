using Ithembahealth.Domain.Common;
using Ithembahealth.Domain.Entities.Appointments;
using Ithembahealth.Domain.Entities.PatientAndProvider;

namespace Ithembahealth.Domain.Entities.ClaimsAndPatient
{
    public class ClaimSubmission : AuditableEntity
    {
        public Guid Id { get; set; }

        public Guid AppointmentId { get; set; }
        public virtual Appointment Appointment { get; set; } = default!;

        public Guid ProviderId { get; set; }
        public virtual Provider Provider { get; set; } = default!;

        public Guid? BeneficiaryId { get; set; }
        public virtual Beneficiary? Beneficiary { get; set; }

        public decimal Amount { get; set; }
        public string Description { get; set; } = "";

        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public string? AttachmentUrl { get; set; }

        public DateTime SubmittedDate { get; set; } = DateTime.UtcNow;
        public DateTime? DecisionDate { get; set; }

        public string? ProcessedBy { get; set; }
        public string? RejectionReason { get; set; }
    }
}
