using Ithembahealth.Application.Contracts.Persistence;
using Ithembahealth.Application.Contracts.Persistence.Appointments;
using Ithembahealth.Persistence.Repositories;
using Ithembahealth.Persistence.SeedData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Persistence
{
    public static class PersistenceServiceRegistration
    {
        public static IServiceCollection AddPersistenceServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<IthembahealthDbContext>(options =>
             options.UseSqlServer(configuration.GetConnectionString("IthembahealthConnectionString"), sql => sql.EnableRetryOnFailure()));

            services.AddScoped(typeof(IAsyncRepository<>), typeof(BaseRepository<>));
            services.AddScoped<IAppointmentRepository, AppointmentRepository>();
            return services;
        } 
    }
}
