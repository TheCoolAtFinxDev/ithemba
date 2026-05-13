using Ithembahealth.Domain.Entities.Appointments;
using MediatR;
using System;

namespace Ithembahealth.Application.Features.Appointments.Commands.CreateAppointment
{
    public class CreateAppointmentCommand : IRequest<Guid>
    {
        public Guid PatientId { get; set; }
        public Guid ProviderId { get; set; }
        public Guid? BeneficiaryId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
