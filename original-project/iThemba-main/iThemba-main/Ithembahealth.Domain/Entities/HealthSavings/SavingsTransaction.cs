using Ithembahealth.Domain.Common;
using Ithembahealth.Domain.Entities.HealthSavings;

namespace Ithembahealth.Domain.Entities.HealthSavings
{
    public class SavingsTransaction : AuditableEntity
    {
        public Guid Id { get; set; }

        // Foreign Key
        public Guid HealthSavingsAccountId { get; set; }
        public virtual HealthSavingsAccount HealthSavingsAccount { get; set; } = default!;

        // Transaction Info
        public decimal Amount { get; set; }
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
        public string TransactionType { get; set; } = ""; // e.g. "Deposit", "Debit", "ClaimPayment"
        public string? MpesaTransactionCode { get; set; }
        public string? Notes { get; set; }
        public bool IsSuccessful { get; set; } = true;
    }
}
