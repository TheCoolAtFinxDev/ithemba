using FluentValidation;

namespace Ithembahealth.Application.Features.Appointments.Commands.CreateAppointment
{
    public class CreateAppointmentValidator : AbstractValidator<CreateAppointmentCommand>
    {
        public CreateAppointmentValidator()
        {
            RuleFor(x => x.PatientId)
                .NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.ProviderId).NotEmpty();
            RuleFor(x => x.AppointmentDate).GreaterThan(DateTime.Now);
            RuleFor(x => x.Reason).NotEmpty().MaximumLength(250);
        }
    }
}
