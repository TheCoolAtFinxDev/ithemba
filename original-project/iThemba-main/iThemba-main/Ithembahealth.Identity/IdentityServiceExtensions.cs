using Ithembahealth.Identity.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Identity
{
    public static class IdentityServiceExtensions
    {
        public static void AddIdentityServices(this IServiceCollection services, IConfiguration configuration)
        {
            //services.AddAuthentication(IdentityConstants.ApplicationScheme)
            //    .AddIdentityCookies(); // enable Identity’s cookie schemes

            services.AddAuthorizationBuilder();

            services.AddDbContext<IthembaHealthIdentityDbContext>(opts =>
                opts.UseSqlServer(
                    configuration.GetConnectionString("IthembahealthIdentityConnectionString"),
                    sql => sql.EnableRetryOnFailure()));

            services.AddIdentity<ApplicationUser, IdentityRole>(opts =>
            {
                opts.Password.RequireNonAlphanumeric = false;
            })
            .AddEntityFrameworkStores<IthembaHealthIdentityDbContext>()
            .AddDefaultTokenProviders()
            .AddApiEndpoints();

      //  IMPORTANT: cookie settings for cross - site(WASM <->API)

       services.ConfigureApplicationCookie(opt =>
       {
           opt.Cookie.Name = "__Host-ithemba-auth";         // good practice
           opt.Cookie.HttpOnly = true;
           opt.Cookie.SameSite = SameSiteMode.None;         // REQUIRED for cross-site
           opt.Cookie.SecurePolicy = CookieSecurePolicy.Always; // HTTPS only on Azure
                                                                // Return status codes for APIs instead of redirects
           opt.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
           opt.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; };
       });

        }
    }
}
