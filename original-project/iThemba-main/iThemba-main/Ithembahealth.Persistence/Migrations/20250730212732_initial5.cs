using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Ithembahealth.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class initial5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppointmentsStatistics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ProviderName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PeriodStart = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalAppointments = table.Column<int>(type: "int", nullable: false),
                    ConfirmedAppointments = table.Column<int>(type: "int", nullable: false),
                    CompletedAppointments = table.Column<int>(type: "int", nullable: false),
                    CancelledAppointments = table.Column<int>(type: "int", nullable: false),
                    NoShows = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppointmentsStatistics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Patients",
                columns: table => new
                {
                    PatientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NationalId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MpesaPhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsPhoneNumberVerified = table.Column<bool>(type: "bit", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Patients", x => x.PatientId);
                });

            migrationBuilder.CreateTable(
                name: "Providers",
                columns: table => new
                {
                    ProviderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClinicName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DoctorName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Specialty = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MpesaMerchantCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BankAccountNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BankName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsVerified = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Providers", x => x.ProviderId);
                });

            migrationBuilder.CreateTable(
                name: "Beneficiaries",
                columns: table => new
                {
                    BeneficiaryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PatientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Relationship = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Gender = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NationalIdNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Beneficiaries", x => x.BeneficiaryId);
                    table.ForeignKey(
                        name: "FK_Beneficiaries_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HealthSavingsAccounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PatientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalContributed = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalClaimed = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AutoDebitEnabled = table.Column<bool>(type: "bit", nullable: false),
                    DebitSourceMpesaNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealthSavingsAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HealthSavingsAccounts_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Specialization",
                columns: table => new
                {
                    SpecializationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProviderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Specialization", x => x.SpecializationId);
                    table.ForeignKey(
                        name: "FK_Specialization_Providers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "Providers",
                        principalColumn: "ProviderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkingHours",
                columns: table => new
                {
                    WorkingHoursId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkingHours", x => x.WorkingHoursId);
                    table.ForeignKey(
                        name: "FK_WorkingHours_Providers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "Providers",
                        principalColumn: "ProviderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Appointments",
                columns: table => new
                {
                    AppointmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PatientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BeneficiaryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AppointmentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsConfirmedByClinic = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appointments", x => x.AppointmentId);
                    table.ForeignKey(
                        name: "FK_Appointments_Beneficiaries_BeneficiaryId",
                        column: x => x.BeneficiaryId,
                        principalTable: "Beneficiaries",
                        principalColumn: "BeneficiaryId");
                    table.ForeignKey(
                        name: "FK_Appointments_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "PatientId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appointments_Providers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "Providers",
                        principalColumn: "ProviderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SavingsTransaction",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HealthSavingsAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TransactionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MpesaTransactionCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsSuccessful = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavingsTransaction", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SavingsTransaction_HealthSavingsAccounts_HealthSavingsAccountId",
                        column: x => x.HealthSavingsAccountId,
                        principalTable: "HealthSavingsAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppointmentNotes",
                columns: table => new
                {
                    AppointmentNoteId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AppointmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AddedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppointmentNotes", x => x.AppointmentNoteId);
                    table.ForeignKey(
                        name: "FK_AppointmentNotes_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "AppointmentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppointmentOTPs",
                columns: table => new
                {
                    AppointmentOtpId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AppointmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OTPCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppointmentOTPs", x => x.AppointmentOtpId);
                    table.ForeignKey(
                        name: "FK_AppointmentOTPs_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "AppointmentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProviderClaims",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HealthSavingsAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DateOfVisit = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AttachmentUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BeneficiaryName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RelationshipToPatient = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DecisionTimestamp = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ApprovedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AdminNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LinkedTransactionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProviderClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProviderClaims_HealthSavingsAccounts_HealthSavingsAccountId",
                        column: x => x.HealthSavingsAccountId,
                        principalTable: "HealthSavingsAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProviderClaims_Providers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "Providers",
                        principalColumn: "ProviderId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProviderClaims_SavingsTransaction_LinkedTransactionId",
                        column: x => x.LinkedTransactionId,
                        principalTable: "SavingsTransaction",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "Patients",
                columns: new[] { "PatientId", "CreatedBy", "CreatedDate", "DateOfBirth", "Email", "FirstName", "IsPhoneNumberVerified", "LastModifiedBy", "LastModifiedDate", "LastName", "MpesaPhoneNumber", "NationalId", "PhoneNumber" },
                values: new object[,]
                {
                    { new Guid("257bd265-04ad-4961-8cd9-d97468547b02"), "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(1992, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "patient2@example.com", "Patient2", true, "", null, "Test2", "+2666000002", "1000000002", "+2666000002" },
                    { new Guid("45485474-6a89-4e04-b292-573d2eb9d481"), "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(1998, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "patient8@example.com", "Patient8", true, "", null, "Test8", "+2666000008", "1000000008", "+2666000008" },
                    { new Guid("7e026d24-9b96-4121-9d0a-07a62c1c4521"), "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(1997, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "patient7@example.com", "Patient7", true, "", null, "Test7", "+2666000007", "1000000007", "+2666000007" },
                    { new Guid("8cebead4-1404-4de2-a868-256753925914"), "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(1994, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "patient4@example.com", "Patient4", true, "", null, "Test4", "+2666000004", "1000000004", "+2666000004" },
                    { new Guid("90b0661b-487b-40ed-88ab-44bf51f3b469"), "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(1999, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "patient9@example.com", "Patient9", true, "", null, "Test9", "+2666000009", "1000000009", "+2666000009" },
                    { new Guid("9178e05e-7b8f-4f8e-bf4f-177a4774c006"), "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(1991, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "patient1@example.com", "Patient1", true, "", null, "Test1", "+2666000001", "1000000001", "+2666000001" },
                    { new Guid("939df4ad-9e5d-474b-9c8d-b8627b323acc"), "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(1996, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "patient6@example.com", "Patient6", true, "", null, "Test6", "+2666000006", "1000000006", "+2666000006" },
                    { new Guid("b584ee0b-19ff-4c8e-94ae-d4618ad51ecc"), "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(1993, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "patient3@example.com", "Patient3", true, "", null, "Test3", "+2666000003", "1000000003", "+2666000003" },
                    { new Guid("baa3b942-6e92-4771-9564-093cd6f323f9"), "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "patient0@example.com", "Patient0", true, "", null, "Test0", "+2666000000", "1000000000", "+2666000000" },
                    { new Guid("f3d06740-d23b-40e2-ac4f-e6f9b8b48435"), "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(1995, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "patient5@example.com", "Patient5", true, "", null, "Test5", "+2666000005", "1000000005", "+2666000005" }
                });

            migrationBuilder.InsertData(
                table: "Providers",
                columns: new[] { "ProviderId", "BankAccountNumber", "BankName", "ClinicName", "CreatedBy", "CreatedDate", "DoctorName", "Email", "IsActive", "IsVerified", "LastModifiedBy", "LastModifiedDate", "Location", "MpesaMerchantCode", "PhoneNumber", "Specialty" },
                values: new object[,]
                {
                    { new Guid("0088fb8d-d364-4e51-90c7-2a1938cb6361"), null, null, "Clinic 6", "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Dr. Provider6", "provider6@clinic.com", true, true, "", null, "District 6", "MPESA006", "+2666111006", "General Medicine" },
                    { new Guid("12eef029-394b-40bf-b2be-4916a716e8f3"), null, null, "Clinic 2", "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Dr. Provider2", "provider2@clinic.com", true, true, "", null, "District 2", "MPESA002", "+2666111002", "General Medicine" },
                    { new Guid("20d1d2a7-e5ac-46ce-8eee-a2512003a03f"), null, null, "Clinic 0", "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Dr. Provider0", "provider0@clinic.com", true, true, "", null, "District 0", "MPESA000", "+2666111000", "General Medicine" },
                    { new Guid("271ad1ee-ae06-4f3d-bae6-0819fa403b12"), null, null, "Clinic 8", "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Dr. Provider8", "provider8@clinic.com", true, true, "", null, "District 8", "MPESA008", "+2666111008", "General Medicine" },
                    { new Guid("384edd91-22f0-4e1e-b028-c54657c6f733"), null, null, "Clinic 5", "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Dr. Provider5", "provider5@clinic.com", true, true, "", null, "District 5", "MPESA005", "+2666111005", "General Medicine" },
                    { new Guid("51933af5-da80-44aa-b30c-c39685f2f11c"), null, null, "Clinic 7", "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Dr. Provider7", "provider7@clinic.com", true, true, "", null, "District 7", "MPESA007", "+2666111007", "General Medicine" },
                    { new Guid("90a8b99b-dfb4-4433-9b85-2c21c5c8aeeb"), null, null, "Clinic 9", "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Dr. Provider9", "provider9@clinic.com", true, true, "", null, "District 9", "MPESA009", "+2666111009", "General Medicine" },
                    { new Guid("ad621338-6267-4424-87e1-be2df82a8605"), null, null, "Clinic 3", "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Dr. Provider3", "provider3@clinic.com", true, true, "", null, "District 3", "MPESA003", "+2666111003", "General Medicine" },
                    { new Guid("be7662a4-4192-4a1b-85b9-b1486d9103b9"), null, null, "Clinic 4", "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Dr. Provider4", "provider4@clinic.com", true, true, "", null, "District 4", "MPESA004", "+2666111004", "General Medicine" },
                    { new Guid("ce34ef0f-88ff-4d46-9e7e-6e75b5c914ef"), null, null, "Clinic 1", "", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Dr. Provider1", "provider1@clinic.com", true, true, "", null, "District 1", "MPESA001", "+2666111001", "General Medicine" }
                });

            migrationBuilder.InsertData(
                table: "Appointments",
                columns: new[] { "AppointmentId", "AppointmentDate", "BeneficiaryId", "CreatedBy", "CreatedDate", "IsConfirmedByClinic", "LastModifiedBy", "LastModifiedDate", "PatientId", "ProviderId", "Reason", "Status" },
                values: new object[,]
                {
                    { new Guid("74e0797a-5d9a-41c7-a653-4956224311eb"), new DateTime(2025, 8, 6, 10, 0, 0, 0, DateTimeKind.Utc), null, "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9825), false, "", null, new Guid("f3d06740-d23b-40e2-ac4f-e6f9b8b48435"), new Guid("384edd91-22f0-4e1e-b028-c54657c6f733"), "Consultation 5", "Booked" },
                    { new Guid("87255d56-f1e6-4d3e-873f-504e38d0529f"), new DateTime(2025, 8, 9, 10, 0, 0, 0, DateTimeKind.Utc), null, "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9839), true, "", null, new Guid("45485474-6a89-4e04-b292-573d2eb9d481"), new Guid("271ad1ee-ae06-4f3d-bae6-0819fa403b12"), "Consultation 8", "Booked" },
                    { new Guid("aae89a05-e860-4fe3-b3cc-6e48fa7b1d2d"), new DateTime(2025, 8, 10, 10, 0, 0, 0, DateTimeKind.Utc), null, "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9843), false, "", null, new Guid("90b0661b-487b-40ed-88ab-44bf51f3b469"), new Guid("90a8b99b-dfb4-4433-9b85-2c21c5c8aeeb"), "Consultation 9", "Booked" },
                    { new Guid("d8f13061-4758-4f8c-b661-5d1673739865"), new DateTime(2025, 8, 7, 10, 0, 0, 0, DateTimeKind.Utc), null, "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9829), true, "", null, new Guid("939df4ad-9e5d-474b-9c8d-b8627b323acc"), new Guid("0088fb8d-d364-4e51-90c7-2a1938cb6361"), "Consultation 6", "Booked" },
                    { new Guid("e9190489-2240-4b80-a320-741681620411"), new DateTime(2025, 8, 8, 10, 0, 0, 0, DateTimeKind.Utc), null, "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9834), false, "", null, new Guid("7e026d24-9b96-4121-9d0a-07a62c1c4521"), new Guid("51933af5-da80-44aa-b30c-c39685f2f11c"), "Consultation 7", "Booked" }
                });

            migrationBuilder.InsertData(
                table: "Beneficiaries",
                columns: new[] { "BeneficiaryId", "CreatedBy", "CreatedDate", "DateOfBirth", "FullName", "Gender", "IsActive", "LastModifiedBy", "LastModifiedDate", "NationalIdNumber", "PatientId", "PhoneNumber", "Relationship" },
                values: new object[,]
                {
                    { new Guid("0d7e0d46-898f-4801-9981-39dbda5484a4"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9690), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Beneficiary 1-1", "", true, "", null, null, new Guid("baa3b942-6e92-4771-9564-093cd6f323f9"), "27000000000", "Child" },
                    { new Guid("24e4138e-aaf0-4e20-8f2e-85aaa1956fb7"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9707), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Beneficiary 4-1", "", true, "", null, null, new Guid("b584ee0b-19ff-4c8e-94ae-d4618ad51ecc"), "27000000030", "Child" },
                    { new Guid("27ed5233-3aed-4e88-a674-2410cbe155b1"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9713), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Beneficiary 5-2", "", true, "", null, null, new Guid("8cebead4-1404-4de2-a868-256753925914"), "27000000041", "Child" },
                    { new Guid("2e34a24c-7685-4b91-bb74-ee77691fbc5a"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9711), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Beneficiary 5-1", "", true, "", null, null, new Guid("8cebead4-1404-4de2-a868-256753925914"), "27000000040", "Parent" },
                    { new Guid("40f06923-25a4-4dec-858d-10c2071ea03a"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9699), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Beneficiary 2-2", "", true, "", null, null, new Guid("9178e05e-7b8f-4f8e-bf4f-177a4774c006"), "27000000011", "Child" },
                    { new Guid("4e82ba5f-5441-4fac-8f94-b9fe82b7930f"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9705), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Beneficiary 3-2", "", true, "", null, null, new Guid("257bd265-04ad-4961-8cd9-d97468547b02"), "27000000021", "Parent" },
                    { new Guid("4f7e03b0-e30a-449c-990b-90c18195a1d5"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9709), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Beneficiary 4-2", "", true, "", null, null, new Guid("b584ee0b-19ff-4c8e-94ae-d4618ad51ecc"), "27000000031", "Child" },
                    { new Guid("82540953-5545-4b2e-af2e-f7814b51b2cd"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9695), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Beneficiary 1-2", "", true, "", null, null, new Guid("baa3b942-6e92-4771-9564-093cd6f323f9"), "27000000001", "Parent" },
                    { new Guid("fdcd4437-8f57-4017-9107-f495ef5258db"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9702), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Beneficiary 3-1", "", true, "", null, null, new Guid("257bd265-04ad-4961-8cd9-d97468547b02"), "27000000020", "Child" },
                    { new Guid("ff059982-f440-430b-94c9-a4a5cca80b36"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9697), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Beneficiary 2-1", "", true, "", null, null, new Guid("9178e05e-7b8f-4f8e-bf4f-177a4774c006"), "27000000010", "Spouse" }
                });

            migrationBuilder.InsertData(
                table: "AppointmentNotes",
                columns: new[] { "AppointmentNoteId", "AddedBy", "AppointmentId", "CreatedBy", "CreatedDate", "LastModifiedBy", "LastModifiedDate", "Note" },
                values: new object[,]
                {
                    { new Guid("0f939e8a-c40c-4b2f-902d-7e48ff635fcf"), "Nurse", new Guid("e9190489-2240-4b80-a320-741681620411"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9916), "", null, "Routine check-in" },
                    { new Guid("3174f25a-5ecd-4da2-b98c-e94150135cfb"), "Nurse", new Guid("aae89a05-e860-4fe3-b3cc-6e48fa7b1d2d"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9920), "", null, "Lab results discussed" },
                    { new Guid("5b693767-65a6-498f-bf25-bd3b3907809a"), "Doctor", new Guid("d8f13061-4758-4f8c-b661-5d1673739865"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9914), "", null, "Follow-up required" },
                    { new Guid("8141ef21-4d7e-4604-841b-31dfd509e1c9"), "Doctor", new Guid("87255d56-f1e6-4d3e-873f-504e38d0529f"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9918), "", null, "Lab results discussed" },
                    { new Guid("b07a896c-c8cb-4a5d-aee0-58a8c5165c97"), "Doctor", new Guid("74e0797a-5d9a-41c7-a653-4956224311eb"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9886), "", null, "Routine check-in" }
                });

            migrationBuilder.InsertData(
                table: "AppointmentOTPs",
                columns: new[] { "AppointmentOtpId", "AppointmentId", "CreatedBy", "CreatedDate", "IsUsed", "LastModifiedBy", "LastModifiedDate", "OTPCode", "SentAt", "UsedAt" },
                values: new object[,]
                {
                    { new Guid("2a8fbfb1-0ff3-41f5-905f-ea7442ab505e"), new Guid("aae89a05-e860-4fe3-b3cc-6e48fa7b1d2d"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 294, DateTimeKind.Utc).AddTicks(6), false, "", null, "766681", new DateTime(2025, 7, 30, 20, 51, 5, 933, DateTimeKind.Utc).AddTicks(2580), null },
                    { new Guid("86a1edd7-bf45-400f-848e-004ccce1c900"), new Guid("87255d56-f1e6-4d3e-873f-504e38d0529f"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 294, DateTimeKind.Utc).AddTicks(1), false, "", null, "651997", new DateTime(2025, 7, 30, 20, 59, 5, 933, DateTimeKind.Utc).AddTicks(2580), null },
                    { new Guid("88027a1c-8bd6-4335-863d-d3b784e42f1e"), new Guid("e9190489-2240-4b80-a320-741681620411"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9997), true, "", null, "435332", new DateTime(2025, 7, 30, 21, 2, 5, 933, DateTimeKind.Utc).AddTicks(2580), new DateTime(2025, 7, 30, 21, 7, 5, 933, DateTimeKind.Utc).AddTicks(2580) },
                    { new Guid("8ed8574e-0dd8-4798-89ca-b134ae522c80"), new Guid("d8f13061-4758-4f8c-b661-5d1673739865"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9991), true, "", null, "226679", new DateTime(2025, 7, 30, 20, 45, 5, 933, DateTimeKind.Utc).AddTicks(2580), new DateTime(2025, 7, 30, 20, 50, 5, 933, DateTimeKind.Utc).AddTicks(2580) },
                    { new Guid("a937731e-508d-478c-beeb-90634055d4c8"), new Guid("74e0797a-5d9a-41c7-a653-4956224311eb"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9984), false, "", null, "413690", new DateTime(2025, 7, 30, 20, 56, 5, 933, DateTimeKind.Utc).AddTicks(2580), null }
                });

            migrationBuilder.InsertData(
                table: "Appointments",
                columns: new[] { "AppointmentId", "AppointmentDate", "BeneficiaryId", "CreatedBy", "CreatedDate", "IsConfirmedByClinic", "LastModifiedBy", "LastModifiedDate", "PatientId", "ProviderId", "Reason", "Status" },
                values: new object[,]
                {
                    { new Guid("025d39f3-3363-4d47-9f26-3a27c83952c6"), new DateTime(2025, 8, 2, 10, 0, 0, 0, DateTimeKind.Utc), new Guid("ff059982-f440-430b-94c9-a4a5cca80b36"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9804), false, "", null, new Guid("9178e05e-7b8f-4f8e-bf4f-177a4774c006"), new Guid("ce34ef0f-88ff-4d46-9e7e-6e75b5c914ef"), "Consultation 1", "Booked" },
                    { new Guid("1b5749f7-7bdd-428d-a162-8beb9e63a2c4"), new DateTime(2025, 8, 4, 10, 0, 0, 0, DateTimeKind.Utc), new Guid("24e4138e-aaf0-4e20-8f2e-85aaa1956fb7"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9815), false, "", null, new Guid("b584ee0b-19ff-4c8e-94ae-d4618ad51ecc"), new Guid("ad621338-6267-4424-87e1-be2df82a8605"), "Consultation 3", "Booked" },
                    { new Guid("3d33bf6d-25f6-4a8e-bca8-63b1637a6815"), new DateTime(2025, 8, 1, 10, 0, 0, 0, DateTimeKind.Utc), new Guid("0d7e0d46-898f-4801-9981-39dbda5484a4"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9798), true, "", null, new Guid("baa3b942-6e92-4771-9564-093cd6f323f9"), new Guid("20d1d2a7-e5ac-46ce-8eee-a2512003a03f"), "Consultation 0", "Booked" },
                    { new Guid("410abe40-fee3-49be-909d-935a9e6f9823"), new DateTime(2025, 8, 5, 10, 0, 0, 0, DateTimeKind.Utc), new Guid("2e34a24c-7685-4b91-bb74-ee77691fbc5a"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9820), true, "", null, new Guid("8cebead4-1404-4de2-a868-256753925914"), new Guid("be7662a4-4192-4a1b-85b9-b1486d9103b9"), "Consultation 4", "Booked" },
                    { new Guid("bf2f7f1e-2236-430f-8cfa-4996435033a0"), new DateTime(2025, 8, 3, 10, 0, 0, 0, DateTimeKind.Utc), new Guid("fdcd4437-8f57-4017-9107-f495ef5258db"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9810), true, "", null, new Guid("257bd265-04ad-4961-8cd9-d97468547b02"), new Guid("12eef029-394b-40bf-b2be-4916a716e8f3"), "Consultation 2", "Booked" }
                });

            migrationBuilder.InsertData(
                table: "AppointmentNotes",
                columns: new[] { "AppointmentNoteId", "AddedBy", "AppointmentId", "CreatedBy", "CreatedDate", "LastModifiedBy", "LastModifiedDate", "Note" },
                values: new object[,]
                {
                    { new Guid("64439e76-0e72-4322-bf8f-3808e0517fe5"), "Nurse", new Guid("bf2f7f1e-2236-430f-8cfa-4996435033a0"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9878), "", null, "Prescription given" },
                    { new Guid("a0522caa-c236-45ea-89b3-dd1fe9f814af"), "Nurse", new Guid("025d39f3-3363-4d47-9f26-3a27c83952c6"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9876), "", null, "Lab results discussed" },
                    { new Guid("b8f8144c-59ad-4e88-8d12-fc144563a9b0"), "Nurse", new Guid("3d33bf6d-25f6-4a8e-bca8-63b1637a6815"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9873), "", null, "Follow-up required" },
                    { new Guid("dc096833-e482-46fa-8e21-75bf2e781297"), "Nurse", new Guid("1b5749f7-7bdd-428d-a162-8beb9e63a2c4"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9879), "", null, "Routine check-in" },
                    { new Guid("e095e3cb-a52c-4f73-81e9-d3e63b3a3baa"), "Nurse", new Guid("410abe40-fee3-49be-909d-935a9e6f9823"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9881), "", null, "Follow-up required" }
                });

            migrationBuilder.InsertData(
                table: "AppointmentOTPs",
                columns: new[] { "AppointmentOtpId", "AppointmentId", "CreatedBy", "CreatedDate", "IsUsed", "LastModifiedBy", "LastModifiedDate", "OTPCode", "SentAt", "UsedAt" },
                values: new object[,]
                {
                    { new Guid("2273dcc0-1eb4-4f9e-bb64-85cf0b800457"), new Guid("bf2f7f1e-2236-430f-8cfa-4996435033a0"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9967), true, "", null, "216480", new DateTime(2025, 7, 30, 20, 25, 5, 933, DateTimeKind.Utc).AddTicks(2580), new DateTime(2025, 7, 30, 20, 30, 5, 933, DateTimeKind.Utc).AddTicks(2580) },
                    { new Guid("4f82a6eb-377d-49dc-bfe9-d33d80c8181a"), new Guid("1b5749f7-7bdd-428d-a162-8beb9e63a2c4"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9974), true, "", null, "865683", new DateTime(2025, 7, 30, 20, 32, 5, 933, DateTimeKind.Utc).AddTicks(2580), new DateTime(2025, 7, 30, 20, 37, 5, 933, DateTimeKind.Utc).AddTicks(2580) },
                    { new Guid("a02a5766-0654-470c-8b78-cd97ddd2e305"), new Guid("3d33bf6d-25f6-4a8e-bca8-63b1637a6815"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9953), false, "", null, "562807", new DateTime(2025, 7, 30, 20, 53, 5, 933, DateTimeKind.Utc).AddTicks(2580), null },
                    { new Guid("bdc769cc-5c9c-4b13-bfc6-04e85d52fe40"), new Guid("410abe40-fee3-49be-909d-935a9e6f9823"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9980), true, "", null, "193282", new DateTime(2025, 7, 30, 20, 39, 5, 933, DateTimeKind.Utc).AddTicks(2580), new DateTime(2025, 7, 30, 20, 44, 5, 933, DateTimeKind.Utc).AddTicks(2580) },
                    { new Guid("ccce56c1-d63f-4b76-94ec-e5c53a258283"), new Guid("025d39f3-3363-4d47-9f26-3a27c83952c6"), "seed", new DateTime(2025, 7, 30, 21, 27, 32, 293, DateTimeKind.Utc).AddTicks(9961), true, "", null, "842529", new DateTime(2025, 7, 30, 21, 5, 5, 933, DateTimeKind.Utc).AddTicks(2580), new DateTime(2025, 7, 30, 21, 10, 5, 933, DateTimeKind.Utc).AddTicks(2580) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentNotes_AppointmentId",
                table: "AppointmentNotes",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentOTPs_AppointmentId",
                table: "AppointmentOTPs",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_BeneficiaryId",
                table: "Appointments",
                column: "BeneficiaryId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_PatientId",
                table: "Appointments",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ProviderId",
                table: "Appointments",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_Beneficiaries_PatientId",
                table: "Beneficiaries",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthSavingsAccounts_PatientId",
                table: "HealthSavingsAccounts",
                column: "PatientId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProviderClaims_HealthSavingsAccountId",
                table: "ProviderClaims",
                column: "HealthSavingsAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_ProviderClaims_LinkedTransactionId",
                table: "ProviderClaims",
                column: "LinkedTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_ProviderClaims_ProviderId",
                table: "ProviderClaims",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_SavingsTransaction_HealthSavingsAccountId",
                table: "SavingsTransaction",
                column: "HealthSavingsAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Specialization_ProviderId",
                table: "Specialization",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkingHours_ProviderId",
                table: "WorkingHours",
                column: "ProviderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppointmentNotes");

            migrationBuilder.DropTable(
                name: "AppointmentOTPs");

            migrationBuilder.DropTable(
                name: "AppointmentsStatistics");

            migrationBuilder.DropTable(
                name: "ProviderClaims");

            migrationBuilder.DropTable(
                name: "Specialization");

            migrationBuilder.DropTable(
                name: "WorkingHours");

            migrationBuilder.DropTable(
                name: "Appointments");

            migrationBuilder.DropTable(
                name: "SavingsTransaction");

            migrationBuilder.DropTable(
                name: "Beneficiaries");

            migrationBuilder.DropTable(
                name: "Providers");

            migrationBuilder.DropTable(
                name: "HealthSavingsAccounts");

            migrationBuilder.DropTable(
                name: "Patients");
        }
    }
}
