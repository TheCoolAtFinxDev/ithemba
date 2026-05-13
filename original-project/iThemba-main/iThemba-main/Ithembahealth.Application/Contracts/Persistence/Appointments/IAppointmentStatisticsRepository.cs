using Ithembahealth.Domain.Entities.Appointments;

namespace Ithembahealth.Application.Contracts.Persistence.Appointments
{
    public interface IAppointmentStatisticsRepository : IAsyncRepository<AppointmentStatistics>
    {
        Task<AppointmentStatistics?> GetForProviderAsync(Guid providerId);
        Task<AppointmentStatistics?> GetForDateAsync(DateTime date);
    }
}
