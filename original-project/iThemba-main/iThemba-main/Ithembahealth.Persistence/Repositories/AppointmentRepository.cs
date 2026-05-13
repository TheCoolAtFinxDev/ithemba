using Ithembahealth.Application.Contracts.Persistence.Appointments;
using Ithembahealth.Application.Features.Appointments.Queries.GetAppointmentList;
using Ithembahealth.Domain.Entities.Appointments;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Persistence.Repositories
{
    public class AppointmentRepository : BaseRepository<Appointment>, IAppointmentRepository
    {
        public AppointmentRepository(IthembahealthDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<List<Appointment>> GetAppointments(GetAppointmentListQuery query)
        {
            ArgumentNullException.ThrowIfNull(query, nameof(query));
            var collection = _dbContext.Appointments.AsQueryable();
            if (query.IncludeProvider)
                collection = collection.Include(a => a.Provider);

            if (query.IncludePastAppoinmentsOnly)
            {
                collection = collection.Where(x => x.AppointmentDate < DateTime.Now);
                return await collection.ToListAsync();

            }

            if (query.IncludeUpcomingAppoinmentsOnly)
            {
                collection = collection.Where(x => x.AppointmentDate >= DateTime.Now);
                return await collection.ToListAsync();
            }

            return await collection.ToListAsync();
        }

        public Task<List<Appointment>> GetAppointmentsByStatusAsync(string status)
        {
            throw new NotImplementedException();
        }

        public Task<List<Appointment>> GetByPatientIdAsync(Guid patientId)
        {
            throw new NotImplementedException();
        }

        public Task<List<Appointment>> GetByProviderIdAsync(Guid providerId)
        {
            throw new NotImplementedException();
        }

        public Task<List<Appointment>> GetUpcomingAppointmentsAsync(DateTime fromDate)
        {
            throw new NotImplementedException();
        }
    }
}
