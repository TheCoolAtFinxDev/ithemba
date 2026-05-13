using Ithembahealth.Identity.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Identity
{
    public class IthembaHealthIdentityDbContext : IdentityDbContext<ApplicationUser>
    {
        public IthembaHealthIdentityDbContext()
        {

        }

        public IthembaHealthIdentityDbContext(DbContextOptions<IthembaHealthIdentityDbContext> options) : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
            => optionsBuilder
        .LogTo(Console.WriteLine)
        .EnableSensitiveDataLogging();

    }
}
