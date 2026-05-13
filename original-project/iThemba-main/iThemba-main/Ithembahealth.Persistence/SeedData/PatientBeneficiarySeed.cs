using Ithembahealth.Domain.Entities.PatientAndProvider;
using Microsoft.EntityFrameworkCore;

namespace Ithembahealth.Persistence.SeedData;

public static class PatientBeneficiarySeed
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Beneficiary>().HasData(
            new Beneficiary
{
    BeneficiaryId = Guid.Parse("0d7e0d46-898f-4801-9981-39dbda5484a4"),
    PatientId = Guid.Parse("baa3b942-6e92-4771-9564-093cd6f323f9"),
    FullName = "Beneficiary 1-1",
    PhoneNumber = "27000000000",
    Relationship = "Child",
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},
new Beneficiary
{
    BeneficiaryId = Guid.Parse("82540953-5545-4b2e-af2e-f7814b51b2cd"),
    PatientId = Guid.Parse("baa3b942-6e92-4771-9564-093cd6f323f9"),
    FullName = "Beneficiary 1-2",
    PhoneNumber = "27000000001",
    Relationship = "Parent",
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},
new Beneficiary
{
    BeneficiaryId = Guid.Parse("ff059982-f440-430b-94c9-a4a5cca80b36"),
    PatientId = Guid.Parse("9178e05e-7b8f-4f8e-bf4f-177a4774c006"),
    FullName = "Beneficiary 2-1",
    PhoneNumber = "27000000010",
    Relationship = "Spouse",
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},
new Beneficiary
{
    BeneficiaryId = Guid.Parse("40f06923-25a4-4dec-858d-10c2071ea03a"),
    PatientId = Guid.Parse("9178e05e-7b8f-4f8e-bf4f-177a4774c006"),
    FullName = "Beneficiary 2-2",
    PhoneNumber = "27000000011",
    Relationship = "Child",
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},
new Beneficiary
{
    BeneficiaryId = Guid.Parse("fdcd4437-8f57-4017-9107-f495ef5258db"),
    PatientId = Guid.Parse("257bd265-04ad-4961-8cd9-d97468547b02"),
    FullName = "Beneficiary 3-1",
    PhoneNumber = "27000000020",
    Relationship = "Child",
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},
new Beneficiary
{
    BeneficiaryId = Guid.Parse("4e82ba5f-5441-4fac-8f94-b9fe82b7930f"),
    PatientId = Guid.Parse("257bd265-04ad-4961-8cd9-d97468547b02"),
    FullName = "Beneficiary 3-2",
    PhoneNumber = "27000000021",
    Relationship = "Parent",
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},
new Beneficiary
{
    BeneficiaryId = Guid.Parse("24e4138e-aaf0-4e20-8f2e-85aaa1956fb7"),
    PatientId = Guid.Parse("b584ee0b-19ff-4c8e-94ae-d4618ad51ecc"),
    FullName = "Beneficiary 4-1",
    PhoneNumber = "27000000030",
    Relationship = "Child",
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},
new Beneficiary
{
    BeneficiaryId = Guid.Parse("4f7e03b0-e30a-449c-990b-90c18195a1d5"),
    PatientId = Guid.Parse("b584ee0b-19ff-4c8e-94ae-d4618ad51ecc"),
    FullName = "Beneficiary 4-2",
    PhoneNumber = "27000000031",
    Relationship = "Child",
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},
new Beneficiary
{
    BeneficiaryId = Guid.Parse("2e34a24c-7685-4b91-bb74-ee77691fbc5a"),
    PatientId = Guid.Parse("8cebead4-1404-4de2-a868-256753925914"),
    FullName = "Beneficiary 5-1",
    PhoneNumber = "27000000040",
    Relationship = "Parent",
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},
new Beneficiary
{
    BeneficiaryId = Guid.Parse("27ed5233-3aed-4e88-a674-2410cbe155b1"),
    PatientId = Guid.Parse("8cebead4-1404-4de2-a868-256753925914"),
    FullName = "Beneficiary 5-2",
    PhoneNumber = "27000000041",
    Relationship = "Child",
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
}
        );
    }
}