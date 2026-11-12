using DoctorPlantTest.DAL.Data;
using DoctorPlantTest.DAL.Entities;
using Microsoft.EntityFrameworkCore;

namespace DoctorPlantTest.API.Data
{
    /// <summary>
    /// First-run setup for a fresh database (staging/production):
    ///  1. applies EF migrations            (Database:AutoMigrate = true)
    ///  2. creates the admin account        (Admin:Email + Admin:Password, only if that email doesn't exist yet)
    ///  3. loads crops/diseases reference data when the diseases table is empty
    /// All steps are idempotent, so it is safe to run on every start.
    /// </summary>
    public static class DatabaseBootstrapper
    {
        public static async Task RunAsync(IServiceProvider services, IConfiguration config, ILogger logger)
        {
            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            if (config.GetValue<bool>("Database:AutoMigrate"))
            {
                logger.LogInformation("Applying database migrations...");
                await db.Database.MigrateAsync();
            }

            var adminEmail = config["Admin:Email"]?.Trim();
            var adminPassword = config["Admin:Password"];
            if (!string.IsNullOrWhiteSpace(adminEmail) && !string.IsNullOrEmpty(adminPassword))
            {
                if (adminPassword.Length < 10)
                    throw new InvalidOperationException("Admin:Password must be at least 10 characters.");

                if (!await db.Users.AnyAsync(u => u.Email == adminEmail))
                {
                    db.Users.Add(new User
                    {
                        FirstName = config["Admin:FirstName"] ?? "Dr",
                        LastName = config["Admin:LastName"] ?? "Plant",
                        Name = config["Admin:Name"] ?? "Dr Plant Admin",
                        Email = adminEmail,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                        Role = "admin",
                        CreatedAt = DateTime.UtcNow,
                    });
                    await db.SaveChangesAsync();
                    logger.LogInformation("Created admin account {Email}", adminEmail);
                }
            }

            if (!await db.Diseases.AnyAsync())
                await LoadReferenceDataAsync(db, logger);
        }

        private static async Task LoadReferenceDataAsync(AppDbContext db, ILogger logger)
        {
            var admin = await db.Users.Where(u => u.Role == "admin").OrderBy(u => u.UserId).FirstOrDefaultAsync();
            if (admin == null)
            {
                logger.LogWarning(
                    "Diseases table is empty but there is no admin account to own the crops. " +
                    "Set Admin:Email and Admin:Password and restart to load the reference data.");
                return;
            }

            var path = Path.Combine(AppContext.BaseDirectory, "Seed", "reference_data.sql");
            if (!File.Exists(path))
            {
                logger.LogWarning("Reference data file not found: {Path}", path);
                return;
            }

            logger.LogInformation("Loading crops and diseases reference data...");
            var sql = "SET FOREIGN_KEY_CHECKS=0;\n" + await File.ReadAllTextAsync(path) +
                      $"\nUPDATE Crops SET UserId = {admin.UserId};\nSET FOREIGN_KEY_CHECKS=1;";

            // The seed is trusted, repo-controlled SQL (no user input), so raw execution is fine here
#pragma warning disable EF1002
            await db.Database.ExecuteSqlRawAsync(sql);
#pragma warning restore EF1002

            logger.LogInformation("Reference data loaded.");
        }
    }
}
