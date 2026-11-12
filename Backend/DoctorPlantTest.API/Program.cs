using DoctorPlantTest.API.Serialization;
using DoctorPlantTest.API.Services;
using Microsoft.OpenApi;
using System.Text.Json.Serialization;
using DoctorPlantTest.BLL.Services;
using DoctorPlantTest.DAL.Data;
using DoctorPlantTest.DAL.Repositories;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new UtcDateTimeJsonConverter());
    options.JsonSerializerOptions.Converters.Add(new NullableUtcDateTimeJsonConverter());
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token. Example: eyJhbGci..."
    });
    options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer", doc), [] }
    });
});

builder.Services.AddHttpClient();

// Fail fast if required secrets are missing (set via user-secrets in dev, environment variables in production)
string RequireSetting(string key)
{
    var value = builder.Configuration[key];
    if (string.IsNullOrWhiteSpace(value))
        throw new InvalidOperationException(
            $"Missing required setting '{key}'. In development: dotnet user-secrets set \"{key}\" \"<value>\". " +
            $"In production: set environment variable '{key.Replace(":", "__")}'.");
    return value;
}

var jwtKey = RequireSetting("Jwt:Key");
if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Jwt:Key must be at least 32 bytes long.");
RequireSetting("ConnectionStrings:DefaultConnection");
RequireSetting("Cloudinary:CloudName");
RequireSetting("Cloudinary:ApiKey");
RequireSetting("Cloudinary:ApiSecret");

// JWT Authentication
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// DbContext — connection string from configuration, not hardcoded
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Cloudinary
builder.Services.AddSingleton<ICloudinaryService, CloudinaryService>();

// Repositories
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

// Services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IDiseaseService, DiseaseService>();
builder.Services.AddScoped<ICropService, CropService>();
builder.Services.AddScoped<ICropDetailService, CropDetailService>();
builder.Services.AddScoped<IImageDiagnosisService, ImageDiagnosisService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ILikeService, LikeService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IContactMessageService, ContactMessageService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// CORS — restrict to known frontend origins (configure in appsettings.json)
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Global exception handler — returns structured JSON for unhandled exceptions
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        var error = context.Features.Get<IExceptionHandlerFeature>();
        if (error != null)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(error.Error, "Unhandled exception");

            await context.Response.WriteAsJsonAsync(new
            {
                message = error?.Error.Message,
                inner = error?.Error.InnerException?.Message,
                stackTrace = error?.Error.StackTrace
            });
        }
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
