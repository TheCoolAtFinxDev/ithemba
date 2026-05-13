using AutoMapper;
using Ithembahealth.Application.Contracts.Persistence;
using Ithembahealth.Application.Contracts.Persistence.Appointments;
using Ithembahealth.Domain.Entities.Appointments;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Application.Features.Appointments.Queries.GetAppointmentList
{
    public class GetAppointmentListQueryHandler : IRequestHandler<GetAppointmentListQuery, List<AppointmentListVm>>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IMapper _mapper;

        public GetAppointmentListQueryHandler(IAppointmentRepository appointmentRepository, IMapper mapper)
        {
            _appointmentRepository = appointmentRepository;
            _mapper = mapper;
        }

        public async Task<List<AppointmentListVm>> Handle(GetAppointmentListQuery request, CancellationToken cancellationToken)
        {

            var allAppointments = await _appointmentRepository.GetAppointments(request);

            return _mapper.Map<List<AppointmentListVm>>(allAppointments);
        }
    }
}
