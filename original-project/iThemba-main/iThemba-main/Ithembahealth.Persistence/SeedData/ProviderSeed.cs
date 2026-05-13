using Ithembahealth.Domain.Entities.PatientAndProvider;
using Microsoft.EntityFrameworkCore;

namespace Ithembahealth.Persistence.SeedData;

public static class ProviderSeed
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Provider>().HasData(
            new Provider
{
    ProviderId = Guid.Parse("20d1d2a7-e5ac-46ce-8eee-a2512003a03f"),
    ClinicName = "Clinic 0",
    DoctorName = "Dr. Provider0",
    Specialty = "General Medicine",
    PhoneNumber = "+2666111000",
    Email = "provider0@clinic.com",
    Location = "District 0",
    MpesaMerchantCode = "MPESA000",
    IsActive = true,
    IsVerified = true
},
new Provider
{
    ProviderId = Guid.Parse("ce34ef0f-88ff-4d46-9e7e-6e75b5c914ef"),
    ClinicName = "Clinic 1",
    DoctorName = "Dr. Provider1",
    Specialty = "General Medicine",
    PhoneNumber = "+2666111001",
    Email = "provider1@clinic.com",
    Location = "District 1",
    MpesaMerchantCode = "MPESA001",
    IsActive = true,
    IsVerified = true
},
new Provider
{
    ProviderId = Guid.Parse("12eef029-394b-40bf-b2be-4916a716e8f3"),
    ClinicName = "Clinic 2",
    DoctorName = "Dr. Provider2",
    Specialty = "General Medicine",
    PhoneNumber = "+2666111002",
    Email = "provider2@clinic.com",
    Location = "District 2",
    MpesaMerchantCode = "MPESA002",
    IsActive = true,
    IsVerified = true
},
new Provider
{
    ProviderId = Guid.Parse("ad621338-6267-4424-87e1-be2df82a8605"),
    ClinicName = "Clinic 3",
    DoctorName = "Dr. Provider3",
    Specialty = "General Medicine",
    PhoneNumber = "+2666111003",
    Email = "provider3@clinic.com",
    Location = "District 3",
    MpesaMerchantCode = "MPESA003",
    IsActive = true,
    IsVerified = true
},
new Provider
{
    ProviderId = Guid.Parse("be7662a4-4192-4a1b-85b9-b1486d9103b9"),
    ClinicName = "Clinic 4",
    DoctorName = "Dr. Provider4",
    Specialty = "General Medicine",
    PhoneNumber = "+2666111004",
    Email = "provider4@clinic.com",
    Location = "District 4",
    MpesaMerchantCode = "MPESA004",
    IsActive = true,
    IsVerified = true
},
new Provider
{
    ProviderId = Guid.Parse("384edd91-22f0-4e1e-b028-c54657c6f733"),
    ClinicName = "Clinic 5",
    DoctorName = "Dr. Provider5",
    Specialty = "General Medicine",
    PhoneNumber = "+2666111005",
    Email = "provider5@clinic.com",
    Location = "District 5",
    MpesaMerchantCode = "MPESA005",
    IsActive = true,
    IsVerified = true
},
new Provider
{
    ProviderId = Guid.Parse("0088fb8d-d364-4e51-90c7-2a1938cb6361"),
    ClinicName = "Clinic 6",
    DoctorName = "Dr. Provider6",
    Specialty = "General Medicine",
    PhoneNumber = "+2666111006",
    Email = "provider6@clinic.com",
    Location = "District 6",
    MpesaMerchantCode = "MPESA006",
    IsActive = true,
    IsVerified = true
},
new Provider
{
    ProviderId = Guid.Parse("51933af5-da80-44aa-b30c-c39685f2f11c"),
    ClinicName = "Clinic 7",
    DoctorName = "Dr. Provider7",
    Specialty = "General Medicine",
    PhoneNumber = "+2666111007",
    Email = "provider7@clinic.com",
    Location = "District 7",
    MpesaMerchantCode = "MPESA007",
    IsActive = true,
    IsVerified = true
},
new Provider
{
    ProviderId = Guid.Parse("271ad1ee-ae06-4f3d-bae6-0819fa403b12"),
    ClinicName = "Clinic 8",
    DoctorName = "Dr. Provider8",
    Specialty = "General Medicine",
    PhoneNumber = "+2666111008",
    Email = "provider8@clinic.com",
    Location = "District 8",
    MpesaMerchantCode = "MPESA008",
    IsActive = true,
    IsVerified = true
},
new Provider
{
    ProviderId = Guid.Parse("90a8b99b-dfb4-4433-9b85-2c21c5c8aeeb"),
    ClinicName = "Clinic 9",
    DoctorName = "Dr. Provider9",
    Specialty = "General Medicine",
    PhoneNumber = "+2666111009",
    Email = "provider9@clinic.com",
    Location = "District 9",
    MpesaMerchantCode = "MPESA009",
    IsActive = true,
    IsVerified = true
}
        );
    }
}