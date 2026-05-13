using Ithembahealth.Domain.Common;
using Ithembahealth.Domain.Entities.HealthSavings;
using System;

namespace Ithembahealth.Domain.Entities.HealthSavings
{
    public class AutoDebitSetup : AuditableEntity
    {
        public Guid Id { get; set; }

        public Guid HealthSavingsAccountId { get; set; }
        public virtual HealthSavingsAccount HealthSavingsAccount { get; set; } = default!;

        public string MpesaPhoneNumber { get; set; } = string.Empty;
        public decimal MonthlyAmount { get; set; }
        public DateTime StartDate { get; set; }
        public bool IsActive { get; set; } = true;

        public string? MpesaMandateId { get; set; } // Unique reference from M-PESA for recurring debits
    }
}
