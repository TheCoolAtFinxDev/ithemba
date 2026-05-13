using Ithembahealth.Domain.Common;

namespace Ithembahealth.Domain.Entities.ClaimsAndPatient
{
    public class ClaimSummaryReport : AuditableEntity
    {
        public Guid Id { get; set; }
        public DateTime ReportDate { get; set; }
        public int TotalClaims { get; set; }
        public decimal TotalAmount { get; set; }
        public int ApprovedCount { get; set; }
        public int RejectedCount { get; set; }
        public string GeneratedBy { get; set; } = "";
    }
}
