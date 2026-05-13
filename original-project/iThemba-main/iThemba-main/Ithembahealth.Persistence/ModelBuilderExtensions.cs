using Microsoft.EntityFrameworkCore;

namespace Ithembahealth.Persistence.SeedData
{
    public static class ModelBuilderExtensions
    {
        public static void ApplySeedData(this ModelBuilder modelBuilder)
        {
            PatientSeed.Seed(modelBuilder);
            PatientBeneficiarySeed.Seed(modelBuilder);
            ProviderSeed.Seed(modelBuilder);
            AppointmentSeed.Seed(modelBuilder);
            AppointmentNoteAndOtpSeed.Seed(modelBuilder);
        }
    }
}
