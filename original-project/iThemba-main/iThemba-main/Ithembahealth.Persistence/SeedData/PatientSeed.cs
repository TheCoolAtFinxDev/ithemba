using Ithembahealth.Domain.Entities.PatientAndProvider;
using Microsoft.EntityFrameworkCore;

namespace Ithembahealth.Persistence.SeedData;

public static class PatientSeed
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Patient>().HasData(
            new Patient
{
    PatientId = Guid.Parse("baa3b942-6e92-4771-9564-093cd6f323f9"),
    FirstName = "Patient0",
    LastName = "Test0",
    NationalId = "1000000000",
    PhoneNumber = "+2666000000",
    Email = "patient0@example.com",
    MpesaPhoneNumber = "+2666000000",
    IsPhoneNumberVerified = true,
    DateOfBirth = DateTime.SpecifyKind(DateTime.Parse("1990-01-01T00:00:00"), DateTimeKind.Utc)
},
new Patient
{
    PatientId = Guid.Parse("9178e05e-7b8f-4f8e-bf4f-177a4774c006"),
    FirstName = "Patient1",
    LastName = "Test1",
    NationalId = "1000000001",
    PhoneNumber = "+2666000001",
    Email = "patient1@example.com",
    MpesaPhoneNumber = "+2666000001",
    IsPhoneNumberVerified = true,
    DateOfBirth = DateTime.SpecifyKind(DateTime.Parse("1991-01-01T00:00:00"), DateTimeKind.Utc)
},
new Patient
{
    PatientId = Guid.Parse("257bd265-04ad-4961-8cd9-d97468547b02"),
    FirstName = "Patient2",
    LastName = "Test2",
    NationalId = "1000000002",
    PhoneNumber = "+2666000002",
    Email = "patient2@example.com",
    MpesaPhoneNumber = "+2666000002",
    IsPhoneNumberVerified = true,
    DateOfBirth = DateTime.SpecifyKind(DateTime.Parse("1992-01-01T00:00:00"), DateTimeKind.Utc)
},
new Patient
{
    PatientId = Guid.Parse("b584ee0b-19ff-4c8e-94ae-d4618ad51ecc"),
    FirstName = "Patient3",
    LastName = "Test3",
    NationalId = "1000000003",
    PhoneNumber = "+2666000003",
    Email = "patient3@example.com",
    MpesaPhoneNumber = "+2666000003",
    IsPhoneNumberVerified = true,
    DateOfBirth = DateTime.SpecifyKind(DateTime.Parse("1993-01-01T00:00:00"), DateTimeKind.Utc)
},
new Patient
{
    PatientId = Guid.Parse("8cebead4-1404-4de2-a868-256753925914"),
    FirstName = "Patient4",
    LastName = "Test4",
    NationalId = "1000000004",
    PhoneNumber = "+2666000004",
    Email = "patient4@example.com",
    MpesaPhoneNumber = "+2666000004",
    IsPhoneNumberVerified = true,
    DateOfBirth = DateTime.SpecifyKind(DateTime.Parse("1994-01-01T00:00:00"), DateTimeKind.Utc)
},
new Patient
{
    PatientId = Guid.Parse("f3d06740-d23b-40e2-ac4f-e6f9b8b48435"),
    FirstName = "Patient5",
    LastName = "Test5",
    NationalId = "1000000005",
    PhoneNumber = "+2666000005",
    Email = "patient5@example.com",
    MpesaPhoneNumber = "+2666000005",
    IsPhoneNumberVerified = true,
    DateOfBirth = DateTime.SpecifyKind(DateTime.Parse("1995-01-01T00:00:00"), DateTimeKind.Utc)
},
new Patient
{
    PatientId = Guid.Parse("939df4ad-9e5d-474b-9c8d-b8627b323acc"),
    FirstName = "Patient6",
    LastName = "Test6",
    NationalId = "1000000006",
    PhoneNumber = "+2666000006",
    Email = "patient6@example.com",
    MpesaPhoneNumber = "+2666000006",
    IsPhoneNumberVerified = true,
    DateOfBirth = DateTime.SpecifyKind(DateTime.Parse("1996-01-01T00:00:00"), DateTimeKind.Utc)
},
new Patient
{
    PatientId = Guid.Parse("7e026d24-9b96-4121-9d0a-07a62c1c4521"),
    FirstName = "Patient7",
    LastName = "Test7",
    NationalId = "1000000007",
    PhoneNumber = "+2666000007",
    Email = "patient7@example.com",
    MpesaPhoneNumber = "+2666000007",
    IsPhoneNumberVerified = true,
    DateOfBirth = DateTime.SpecifyKind(DateTime.Parse("1997-01-01T00:00:00"), DateTimeKind.Utc)
},
new Patient
{
    PatientId = Guid.Parse("45485474-6a89-4e04-b292-573d2eb9d481"),
    FirstName = "Patient8",
    LastName = "Test8",
    NationalId = "1000000008",
    PhoneNumber = "+2666000008",
    Email = "patient8@example.com",
    MpesaPhoneNumber = "+2666000008",
    IsPhoneNumberVerified = true,
    DateOfBirth = DateTime.SpecifyKind(DateTime.Parse("1998-01-01T00:00:00"), DateTimeKind.Utc)
},
new Patient
{
    PatientId = Guid.Parse("90b0661b-487b-40ed-88ab-44bf51f3b469"),
    FirstName = "Patient9",
    LastName = "Test9",
    NationalId = "1000000009",
    PhoneNumber = "+2666000009",
    Email = "patient9@example.com",
    MpesaPhoneNumber = "+2666000009",
    IsPhoneNumberVerified = true,
    DateOfBirth = DateTime.SpecifyKind(DateTime.Parse("1999-01-01T00:00:00"), DateTimeKind.Utc)
}
        );
    }
}