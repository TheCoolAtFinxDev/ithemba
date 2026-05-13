using Ithembahealth.Application.Contracts;
using Ithembahealth.Domain.Common;
using Ithembahealth.Domain.Entities.Appointments;
using Ithembahealth.Domain.Entities.ClaimsAndPatient;
using Ithembahealth.Domain.Entities.HealthSavings;
using Ithembahealth.Domain.Entities.PatientAndProvider;
using Ithembahealth.Persistence.SeedData;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Persistence
{
    public class IthembahealthDbContext:DbContext 
    {
        private readonly ILoggedInUserService? _loggedInUserService;

        public IthembahealthDbContext(DbContextOptions<IthembahealthDbContext> options): base(options) { }
        public IthembahealthDbContext(DbContextOptions<IthembahealthDbContext> options, ILoggedInUserService loggedInUserService) 
            : base(options) 
        {
            _loggedInUserService = loggedInUserService;
        }

        //Appointments
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<AppointmentNote> AppointmentNotes { get; set; }
        public DbSet<AppointmentOTP> AppointmentOTPs { get; set; }
        public DbSet<AppointmentStatistics> AppointmentsStatistics { get; set; }
        public DbSet<Beneficiary> Beneficiaries { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Provider> Providers { get; set; }
        //Claims 
        public DbSet<ProviderClaim> ProviderClaims { get; set; }
        public DbSet<HealthSavingsAccount> HealthSavingsAccounts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySeedData();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
        {
            foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedDate = DateTime.Now;
                        entry.Entity.CreatedBy = _loggedInUserService.UserId;
                        break;
                    case EntityState.Modified:
                        entry.Entity.LastModifiedDate = DateTime.Now;
                        entry.Entity.LastModifiedBy = _loggedInUserService.UserId;
                        break;
                }
            }
            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
