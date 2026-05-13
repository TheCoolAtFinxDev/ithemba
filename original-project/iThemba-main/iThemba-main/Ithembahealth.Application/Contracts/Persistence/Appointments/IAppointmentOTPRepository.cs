using Ithembahealth.Domain.Entities.Appointments;

namespace Ithembahealth.Application.Contracts.Persistence.Appointments
{
    public interface IAppointmentOtpRepository : IAsyncRepository<AppointmentOTP>
    {
        Task<AppointmentOTP?> GetValidOtpAsync(Guid appointmentId, string code);
        Task InvalidateOtpAsync(Guid appointmentId);
    }
}
