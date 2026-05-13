using Ithembahealth.API;
using Ithembahealth.Persistence;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

Log.Information("Ithemba Health API starting");

var builder = WebApplication.CreateBuilder(args);

//builder.Configuration
//    .AddJsonFile("appsettings.json", optional: false)
//    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
//    .AddEnvironmentVariables();
builder.Host.UseSerilog(
      (context, services, configuration) => configuration
          .ReadFrom.Configuration(context.Configuration)
          .ReadFrom.Services(services)
          .Enrich.FromLogContext()
          .WriteTo.Console(),
      true
  );

var app = builder
       .ConfigureServices()
       .ConfigurePipeline();

app.UseSerilogRequestLogging();

//await app.ResetDatabaseAsync();
//await app.SeedRolesAsync();
await app.TryMigrateAndSeedAsync();

app.Run();
public partial class Program { }