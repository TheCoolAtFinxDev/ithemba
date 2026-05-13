using Ithembahealth.API.Middleware;
using Ithembahealth.API.Services;
using Ithembahealth.Application;
using Ithembahealth.Application.Contracts;
using Ithembahealth.Identity;
using Ithembahealth.Identity.Models;
using Ithembahealth.Infrastructure;
using Ithembahealth.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Ithembahealth.API
{
    public static class StartupExtensions
    {
        public static WebApplication ConfigureServices(
            this WebApplicationBuilder builder)
        {
            builder.Services.AddApplicationServices();
            builder.Services.AddInfrastructureServices(builder.Configuration);
            builder.Services.AddPersistenceServices(builder.Configuration);
            builder.Services.AddIdentityServices(builder.Configuration);

            builder.Services.AddScoped<ILoggedInUserService, LoggedInUserService>();

            builder.Services.AddHttpContextAccessor();

            builder.Services.AddControllers();

            builder.Services.AddCors(
                options => options.AddPolicy(
                    "open",
                    policy => policy.WithOrigins([builder.Configuration["ApiUrl"] ?? "https://localhost:7133",
                        builder.Configuration["BlazorUrl"] ?? "https://localhost:7225"])
            .AllowAnyMethod()
            //.SetIsOriginAllowed(pol => true)
            .AllowAnyHeader()
            .AllowCredentials()));



            //builder.Services.AddCors(options =>
            //{
            //    var allowedOrigins = builder.Configuration
            //        .GetSection("Cors:AllowedOrigins").Get<string[]>()
            //        ?? new[] { "https://ithembahealthwebapp.azurewebsites.net" };

            //    options.AddPolicy("open", policy =>
            //    {
            //        policy.WithOrigins(allowedOrigins)
            //              .AllowAnyHeader()
            //              .AllowAnyMethod()
            //              // Only enable credentials if you actually use cookies/signalR auth
            //              // Otherwise leave it off for simpler config
            //              .AllowCredentials();
            //              ;
            //    });
            //});


            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            return builder.Build();
        }
        public static WebApplication ConfigurePipeline(this WebApplication app)
        {
            app.MapCustomIdentityApi<ApplicationUser>();

            app.MapPost("/Logout", async (ClaimsPrincipal user, SignInManager<ApplicationUser> signInManager) =>
            {
                await signInManager.SignOutAsync();
                return TypedResults.Ok();
            });

            // Order matters
            app.UseCustomExceptionHandler();
            app.UseHttpsRedirection();

            app.UseCors("open");

            app.UseAuthentication();   // <-- add this
            app.UseAuthorization();    // <-- and this

            if (app.Environment.IsDevelopment() || true)
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.MapGet("/", () => Results.Ok("API running"));
            app.MapControllers();

            return app;
        }


        public static async Task TryMigrateAndSeedAsync(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var sp = scope.ServiceProvider;
            var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");

            try
            {
                // Main app DB
                var appDb = sp.GetRequiredService<IthembahealthDbContext>();
                if (await appDb.Database.CanConnectAsync())
                {
                    // Optional: only auto-migrate in non-prod
                    if (!app.Environment.IsProduction())
                        await appDb.Database.MigrateAsync();
                }
                else
                {
                    logger.LogWarning("App DB not reachable; skipping migrations.");
                }

                // Identity DB
                var idDb = sp.GetRequiredService<IthembaHealthIdentityDbContext>();
                var canReachIdentity = await idDb.Database.CanConnectAsync();
                if (canReachIdentity)
                {
                    if (!app.Environment.IsProduction())
                        await idDb.Database.MigrateAsync();

                    // Seed roles
                    var roleManager = sp.GetRequiredService<RoleManager<IdentityRole>>();
                    string[] roleNames = { "Patient", "Provider", "Admin" };
                    foreach (var role in roleNames)
                    {
                        if (!await roleManager.RoleExistsAsync(role))
                        {
                            var createResult = await roleManager.CreateAsync(new IdentityRole(role));
                            if (!createResult.Succeeded)
                            {
                                logger.LogWarning("Failed creating role {Role}: {Errors}",
                                    role, string.Join(", ", createResult.Errors.Select(e => e.Description)));
                            }
                        }
                    }
                }
                else
                {
                    logger.LogWarning("Identity DB not reachable; skipping migrations and role seeding.");
                }
            }
            catch (Exception ex)
            {
                // Don’t crash the app; log and continue
                logger.LogError(ex, "Startup migration/seeding failed. App will continue to run.");
            }
        }
    

        public static async Task ResetDatabaseAsync(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            try
            {
                var context = scope.ServiceProvider.GetService<IthembahealthDbContext>();
                if (context != null)
                {
                    await context.Database.EnsureDeletedAsync();
                    await context.Database.MigrateAsync();
                }
            }
            catch (Exception ex)
            {
                //add logging here later on
            }
        }
        public static async Task SeedRolesAsync(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            try
            {
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
                string[] roleNames = { "Patient", "Provider", "Admin" };
                foreach (var roleName in roleNames)
                {
                    if (!await roleManager.RoleExistsAsync(roleName))
                    {
                        await roleManager.CreateAsync(new IdentityRole(roleName));
                    }
                }
            }
            catch (Exception ex)
            {
                //add logging here later on
            }
        }
    }
}
