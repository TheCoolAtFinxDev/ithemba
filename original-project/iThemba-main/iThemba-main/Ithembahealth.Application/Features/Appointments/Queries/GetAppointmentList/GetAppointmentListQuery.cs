using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Application.Features.Appointments.Queries.GetAppointmentList
{
    public class GetAppointmentListQuery: IRequest<List<AppointmentListVm>>
    {
        public bool IncludeProvider { get; set; } = false;
        public bool IncludePastAppoinments { get; set; } = false;
        public bool IncludePastAppoinmentsOnly { get; set; } = false;
        public bool IncludeUpcomingAppoinmentsOnly { get; set; } = false;

    }
}
