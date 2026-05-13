using Ithembahealth.Domain.Entities.Appointments;
using Microsoft.EntityFrameworkCore;

namespace Ithembahealth.Persistence.SeedData;

public static class AppointmentNoteAndOtpSeed
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppointmentNote>().HasData(

                new AppointmentNote
                {
                    AppointmentNoteId = Guid.Parse("b8f8144c-59ad-4e88-8d12-fc144563a9b0"),
                    AppointmentId = Guid.Parse("3d33bf6d-25f6-4a8e-bca8-63b1637a6815"),
                    Note = "Follow-up required",
                    AddedBy = "Nurse",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentNote
                {
                    AppointmentNoteId = Guid.Parse("a0522caa-c236-45ea-89b3-dd1fe9f814af"),
                    AppointmentId = Guid.Parse("025d39f3-3363-4d47-9f26-3a27c83952c6"),
                    Note = "Lab results discussed",
                    AddedBy = "Nurse",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentNote
                {
                    AppointmentNoteId = Guid.Parse("64439e76-0e72-4322-bf8f-3808e0517fe5"),
                    AppointmentId = Guid.Parse("bf2f7f1e-2236-430f-8cfa-4996435033a0"),
                    Note = "Prescription given",
                    AddedBy = "Nurse",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentNote
                {
                    AppointmentNoteId = Guid.Parse("dc096833-e482-46fa-8e21-75bf2e781297"),
                    AppointmentId = Guid.Parse("1b5749f7-7bdd-428d-a162-8beb9e63a2c4"),
                    Note = "Routine check-in",
                    AddedBy = "Nurse",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentNote
                {
                    AppointmentNoteId = Guid.Parse("e095e3cb-a52c-4f73-81e9-d3e63b3a3baa"),
                    AppointmentId = Guid.Parse("410abe40-fee3-49be-909d-935a9e6f9823"),
                    Note = "Follow-up required",
                    AddedBy = "Nurse",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentNote
                {
                    AppointmentNoteId = Guid.Parse("b07a896c-c8cb-4a5d-aee0-58a8c5165c97"),
                    AppointmentId = Guid.Parse("74e0797a-5d9a-41c7-a653-4956224311eb"),
                    Note = "Routine check-in",
                    AddedBy = "Doctor",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentNote
                {
                    AppointmentNoteId = Guid.Parse("5b693767-65a6-498f-bf25-bd3b3907809a"),
                    AppointmentId = Guid.Parse("d8f13061-4758-4f8c-b661-5d1673739865"),
                    Note = "Follow-up required",
                    AddedBy = "Doctor",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentNote
                {
                    AppointmentNoteId = Guid.Parse("0f939e8a-c40c-4b2f-902d-7e48ff635fcf"),
                    AppointmentId = Guid.Parse("e9190489-2240-4b80-a320-741681620411"),
                    Note = "Routine check-in",
                    AddedBy = "Nurse",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentNote
                {
                    AppointmentNoteId = Guid.Parse("8141ef21-4d7e-4604-841b-31dfd509e1c9"),
                    AppointmentId = Guid.Parse("87255d56-f1e6-4d3e-873f-504e38d0529f"),
                    Note = "Lab results discussed",
                    AddedBy = "Doctor",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentNote
                {
                    AppointmentNoteId = Guid.Parse("3174f25a-5ecd-4da2-b98c-e94150135cfb"),
                    AppointmentId = Guid.Parse("aae89a05-e860-4fe3-b3cc-6e48fa7b1d2d"),
                    Note = "Lab results discussed",
                    AddedBy = "Nurse",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                }
        );

        modelBuilder.Entity<AppointmentOTP>().HasData(

                new AppointmentOTP
                {
                    AppointmentOtpId = Guid.Parse("a02a5766-0654-470c-8b78-cd97ddd2e305"),
                    AppointmentId = Guid.Parse("3d33bf6d-25f6-4a8e-bca8-63b1637a6815"),
                    OTPCode = "562807",
                    SentAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:53:05.933258"), DateTimeKind.Utc),
                    IsUsed = false,
                    UsedAt = null,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentOTP
                {
                    AppointmentOtpId = Guid.Parse("ccce56c1-d63f-4b76-94ec-e5c53a258283"),
                    AppointmentId = Guid.Parse("025d39f3-3363-4d47-9f26-3a27c83952c6"),
                    OTPCode = "842529",
                    SentAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T21:05:05.933258"), DateTimeKind.Utc),
                    IsUsed = true,
                    UsedAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T21:10:05.933258"), DateTimeKind.Utc),
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentOTP
                {
                    AppointmentOtpId = Guid.Parse("2273dcc0-1eb4-4f9e-bb64-85cf0b800457"),
                    AppointmentId = Guid.Parse("bf2f7f1e-2236-430f-8cfa-4996435033a0"),
                    OTPCode = "216480",
                    SentAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:25:05.933258"), DateTimeKind.Utc),
                    IsUsed = true,
                    UsedAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:30:05.933258"), DateTimeKind.Utc),
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentOTP
                {
                    AppointmentOtpId = Guid.Parse("4f82a6eb-377d-49dc-bfe9-d33d80c8181a"),
                    AppointmentId = Guid.Parse("1b5749f7-7bdd-428d-a162-8beb9e63a2c4"),
                    OTPCode = "865683",
                    SentAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:32:05.933258"), DateTimeKind.Utc),
                    IsUsed = true,
                    UsedAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:37:05.933258"), DateTimeKind.Utc),
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentOTP
                {
                    AppointmentOtpId = Guid.Parse("bdc769cc-5c9c-4b13-bfc6-04e85d52fe40"),
                    AppointmentId = Guid.Parse("410abe40-fee3-49be-909d-935a9e6f9823"),
                    OTPCode = "193282",
                    SentAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:39:05.933258"), DateTimeKind.Utc),
                    IsUsed = true,
                    UsedAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:44:05.933258"), DateTimeKind.Utc),
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentOTP
                {
                    AppointmentOtpId = Guid.Parse("a937731e-508d-478c-beeb-90634055d4c8"),
                    AppointmentId = Guid.Parse("74e0797a-5d9a-41c7-a653-4956224311eb"),
                    OTPCode = "413690",
                    SentAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:56:05.933258"), DateTimeKind.Utc),
                    IsUsed = false,
                    UsedAt = null,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentOTP
                {
                    AppointmentOtpId = Guid.Parse("8ed8574e-0dd8-4798-89ca-b134ae522c80"),
                    AppointmentId = Guid.Parse("d8f13061-4758-4f8c-b661-5d1673739865"),
                    OTPCode = "226679",
                    SentAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:45:05.933258"), DateTimeKind.Utc),
                    IsUsed = true,
                    UsedAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:50:05.933258"), DateTimeKind.Utc),
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentOTP
                {
                    AppointmentOtpId = Guid.Parse("88027a1c-8bd6-4335-863d-d3b784e42f1e"),
                    AppointmentId = Guid.Parse("e9190489-2240-4b80-a320-741681620411"),
                    OTPCode = "435332",
                    SentAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T21:02:05.933258"), DateTimeKind.Utc),
                    IsUsed = true,
                    UsedAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T21:07:05.933258"), DateTimeKind.Utc),
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentOTP
                {
                    AppointmentOtpId = Guid.Parse("86a1edd7-bf45-400f-848e-004ccce1c900"),
                    AppointmentId = Guid.Parse("87255d56-f1e6-4d3e-873f-504e38d0529f"),
                    OTPCode = "651997",
                    SentAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:59:05.933258"), DateTimeKind.Utc),
                    IsUsed = false,
                    UsedAt = null,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                },
                new AppointmentOTP
                {
                    AppointmentOtpId = Guid.Parse("2a8fbfb1-0ff3-41f5-905f-ea7442ab505e"),
                    AppointmentId = Guid.Parse("aae89a05-e860-4fe3-b3cc-6e48fa7b1d2d"),
                    OTPCode = "766681",
                    SentAt = DateTime.SpecifyKind(DateTime.Parse("2025-07-30T20:51:05.933258"), DateTimeKind.Utc),
                    IsUsed = false,
                    UsedAt = null,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = "seed"
                }
        );
    }
}
