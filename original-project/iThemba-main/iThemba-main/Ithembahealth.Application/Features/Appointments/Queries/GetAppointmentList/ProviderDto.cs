namespace Ithembahealth.Application.Features.Appointments.Queries.GetAppointmentList
{
    public class ProviderDto
    {
        public Guid ProviderId { get; set; }
        public string DoctorName { get; set; } = "";
        public string Specialty { get; set; }
        public string Location { get; set; }

    }
}