using AutoMapper;
using Ithembahealth.Application.Contracts.Persistence;
using Ithembahealth.Application.Contracts.Persistence.Appointments;
using Ithembahealth.Domain.Entities.Appointments;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ithembahealth.Application.Features.Appointments.Commands.CreateAppointment
{
    public class CreateAppointmentCommandHandler : IRequestHandler<CreateAppointmentCommand, Guid>
    {
        private readonly IAsyncRepository<Appointment> _appointmentRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateAppointmentCommandHandler> _logger;
        public CreateAppointmentCommandHandler(IAppointmentRepository appointmentRepository, IMapper mapper, ILogger<CreateAppointmentCommandHandler> logger)
        {
            _appointmentRepository = appointmentRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<Guid> Handle(CreateAppointmentCommand request, CancellationToken cancellationToken)
        {
            var validator = new CreateAppointmentValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (validationResult.Errors.Count > 0)
                throw new Exceptions.ValidationException(validationResult);

            var appointment = _mapper.Map<Appointment>(request);
            appointment = await _appointmentRepository.AddAsync(appointment);

            // Send Email or SMS OTP here
            //
            //

            return appointment.AppointmentId;
          
        }
    }
}
