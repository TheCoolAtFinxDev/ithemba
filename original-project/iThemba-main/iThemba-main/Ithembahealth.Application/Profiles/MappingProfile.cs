using AutoMapper;
using Ithembahealth.Application.Features.Appointments.Commands.CreateAppointment;
using Ithembahealth.Application.Features.Appointments.Queries.GetAppointmentList;
using Ithembahealth.Domain.Entities.Appointments;
using Ithembahealth.Domain.Entities.PatientAndProvider;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Application.Profiles
{
    public class MappingProfile:Profile
    {
        public MappingProfile() { 
        
            CreateMap<Appointment, CreateAppointmentCommand>().ReverseMap();
            CreateMap<Appointment, AppointmentListVm>()
                               .ForMember(dest => dest.AppointmentDate, opt => opt.MapFrom(src => src.AppointmentDate.ToString("yyyy-MM-dd HH:mm:ss")))
                               .ReverseMap();
            CreateMap<Provider, ProviderDto>().ReverseMap();

        }
    }
}
