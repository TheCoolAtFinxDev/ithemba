namespace Ithembahealth.Application.Features.Appointments.Queries.GetAppointmentList
{
    public class AppointmentListVm
    {
        public Guid AppointmentId { get; set; }
        public ProviderDto Provider { get; set; }
        public string AppointmentDate { get; set; }
    }
}