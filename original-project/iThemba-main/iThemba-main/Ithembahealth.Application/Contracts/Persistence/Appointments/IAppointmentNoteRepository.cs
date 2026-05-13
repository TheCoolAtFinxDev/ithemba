using Ithembahealth.Domain.Entities.Appointments;

namespace Ithembahealth.Application.Contracts.Persistence.Appointments
{
    public interface IAppointmentNoteRepository : IAsyncRepository<AppointmentNote>
    {
        Task<List<AppointmentNote>> GetByAppointmentIdAsync(Guid appointmentId);
    }
}
