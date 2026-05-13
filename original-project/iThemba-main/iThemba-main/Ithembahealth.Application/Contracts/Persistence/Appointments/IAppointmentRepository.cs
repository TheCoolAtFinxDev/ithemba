using Ithembahealth.Application.Features.Appointments.Queries.GetAppointmentList;
using Ithembahealth.Domain.Entities.Appointments;

namespace Ithembahealth.Application.Contracts.Persistence.Appointments
{
    public interface IAppointmentRepository : IAsyncRepository<Appointment>
    {
        Task<List<Appointment>> GetAppointments(GetAppointmentListQuery query);
        Task<List<Appointment>> GetByPatientIdAsync(Guid patientId);
        Task<List<Appointment>> GetByProviderIdAsync(Guid providerId);
        Task<List<Appointment>> GetUpcomingAppointmentsAsync(DateTime fromDate);
        Task<List<Appointment>> GetAppointmentsByStatusAsync(string status);
    }
}
