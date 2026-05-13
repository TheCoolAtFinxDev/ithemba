using Ithembahealth.Domain.Entities.Appointments;
using Microsoft.EntityFrameworkCore;

namespace Ithembahealth.Persistence.SeedData;

public static class AppointmentSeed
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Appointment>().HasData(
new Appointment
{
    AppointmentId = Guid.Parse("3d33bf6d-25f6-4a8e-bca8-63b1637a6815"),
    PatientId = Guid.Parse("baa3b942-6e92-4771-9564-093cd6f323f9"),
    ProviderId = Guid.Parse("20d1d2a7-e5ac-46ce-8eee-a2512003a03f"),
    BeneficiaryId = Guid.Parse("0d7e0d46-898f-4801-9981-39dbda5484a4"),
    AppointmentDate = DateTime.SpecifyKind(DateTime.Parse("2025-08-01T10:00:00"), DateTimeKind.Utc),
    Reason = "Consultation 0",
    Status = "Booked",
    IsConfirmedByClinic = true,
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},

new Appointment
{
    AppointmentId = Guid.Parse("025d39f3-3363-4d47-9f26-3a27c83952c6"),
    PatientId = Guid.Parse("9178e05e-7b8f-4f8e-bf4f-177a4774c006"),
    ProviderId = Guid.Parse("ce34ef0f-88ff-4d46-9e7e-6e75b5c914ef"),
    BeneficiaryId = Guid.Parse("ff059982-f440-430b-94c9-a4a5cca80b36"),
    AppointmentDate = DateTime.SpecifyKind(DateTime.Parse("2025-08-02T10:00:00"), DateTimeKind.Utc),
    Reason = "Consultation 1",
    Status = "Booked",
    IsConfirmedByClinic = false,
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},

new Appointment
{
    AppointmentId = Guid.Parse("bf2f7f1e-2236-430f-8cfa-4996435033a0"),
    PatientId = Guid.Parse("257bd265-04ad-4961-8cd9-d97468547b02"),
    ProviderId = Guid.Parse("12eef029-394b-40bf-b2be-4916a716e8f3"),
    BeneficiaryId = Guid.Parse("fdcd4437-8f57-4017-9107-f495ef5258db"),
    AppointmentDate = DateTime.SpecifyKind(DateTime.Parse("2025-08-03T10:00:00"), DateTimeKind.Utc),
    Reason = "Consultation 2",
    Status = "Booked",
    IsConfirmedByClinic = true,
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},

new Appointment
{
    AppointmentId = Guid.Parse("1b5749f7-7bdd-428d-a162-8beb9e63a2c4"),
    PatientId = Guid.Parse("b584ee0b-19ff-4c8e-94ae-d4618ad51ecc"),
    ProviderId = Guid.Parse("ad621338-6267-4424-87e1-be2df82a8605"),
    BeneficiaryId = Guid.Parse("24e4138e-aaf0-4e20-8f2e-85aaa1956fb7"),
    AppointmentDate = DateTime.SpecifyKind(DateTime.Parse("2025-08-04T10:00:00"), DateTimeKind.Utc),
    Reason = "Consultation 3",
    Status = "Booked",
    IsConfirmedByClinic = false,
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},

new Appointment
{
    AppointmentId = Guid.Parse("410abe40-fee3-49be-909d-935a9e6f9823"),
    PatientId = Guid.Parse("8cebead4-1404-4de2-a868-256753925914"),
    ProviderId = Guid.Parse("be7662a4-4192-4a1b-85b9-b1486d9103b9"),
    BeneficiaryId = Guid.Parse("2e34a24c-7685-4b91-bb74-ee77691fbc5a"),
    AppointmentDate = DateTime.SpecifyKind(DateTime.Parse("2025-08-05T10:00:00"), DateTimeKind.Utc),
    Reason = "Consultation 4",
    Status = "Booked",
    IsConfirmedByClinic = true,
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},

new Appointment
{
    AppointmentId = Guid.Parse("74e0797a-5d9a-41c7-a653-4956224311eb"),
    PatientId = Guid.Parse("f3d06740-d23b-40e2-ac4f-e6f9b8b48435"),
    ProviderId = Guid.Parse("384edd91-22f0-4e1e-b028-c54657c6f733"),
    AppointmentDate = DateTime.SpecifyKind(DateTime.Parse("2025-08-06T10:00:00"), DateTimeKind.Utc),
    Reason = "Consultation 5",
    Status = "Booked",
    IsConfirmedByClinic = false,
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},

new Appointment
{
    AppointmentId = Guid.Parse("d8f13061-4758-4f8c-b661-5d1673739865"),
    PatientId = Guid.Parse("939df4ad-9e5d-474b-9c8d-b8627b323acc"),
    ProviderId = Guid.Parse("0088fb8d-d364-4e51-90c7-2a1938cb6361"),
    AppointmentDate = DateTime.SpecifyKind(DateTime.Parse("2025-08-07T10:00:00"), DateTimeKind.Utc),
    Reason = "Consultation 6",
    Status = "Booked",
    IsConfirmedByClinic = true,
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},

new Appointment
{
    AppointmentId = Guid.Parse("e9190489-2240-4b80-a320-741681620411"),
    PatientId = Guid.Parse("7e026d24-9b96-4121-9d0a-07a62c1c4521"),
    ProviderId = Guid.Parse("51933af5-da80-44aa-b30c-c39685f2f11c"),
    AppointmentDate = DateTime.SpecifyKind(DateTime.Parse("2025-08-08T10:00:00"), DateTimeKind.Utc),
    Reason = "Consultation 7",
    Status = "Booked",
    IsConfirmedByClinic = false,
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},

new Appointment
{
    AppointmentId = Guid.Parse("87255d56-f1e6-4d3e-873f-504e38d0529f"),
    PatientId = Guid.Parse("45485474-6a89-4e04-b292-573d2eb9d481"),
    ProviderId = Guid.Parse("271ad1ee-ae06-4f3d-bae6-0819fa403b12"),
    AppointmentDate = DateTime.SpecifyKind(DateTime.Parse("2025-08-09T10:00:00"), DateTimeKind.Utc),
    Reason = "Consultation 8",
    Status = "Booked",
    IsConfirmedByClinic = true,
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
},

new Appointment
{
    AppointmentId = Guid.Parse("aae89a05-e860-4fe3-b3cc-6e48fa7b1d2d"),
    PatientId = Guid.Parse("90b0661b-487b-40ed-88ab-44bf51f3b469"),
    ProviderId = Guid.Parse("90a8b99b-dfb4-4433-9b85-2c21c5c8aeeb"),
    AppointmentDate = DateTime.SpecifyKind(DateTime.Parse("2025-08-10T10:00:00"), DateTimeKind.Utc),
    Reason = "Consultation 9",
    Status = "Booked",
    IsConfirmedByClinic = false,
    CreatedDate = DateTime.UtcNow,
    CreatedBy = "seed"
}
        );
    }
}