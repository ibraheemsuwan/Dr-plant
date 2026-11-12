using DoctorPlantTest.API.Authorization;
using DoctorPlantTest.API.Diagnosis;
using DoctorPlantTest.API.Serialization;
using DoctorPlantTest.BLL.Exceptions;
using Microsoft.AspNetCore.HttpOverrides;
using System.Threading.RateLimiting;
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

// Authorization — role "admin" comes from the JWT role claim
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.Admin, policy => policy.RequireRole("admin", "Admin"));
});

// Rate limiting — protects login/register from brute force and the model from abuse
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Too many requests. Please wait a moment and try again." }, token);
    };

    // 10 login/register attempts per minute per IP
    options.AddPolicy(RateLimitPolicies.Auth, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // 5 contact-form messages per 10 minutes per IP (anti-spam)
    options.AddPolicy(RateLimitPolicies.Contact, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0
            }));

    // 30 diagnoses per hour per user (falls back to IP)
    options.AddPolicy(RateLimitPolicies.Predict, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.User.GetUserId()?.ToString()
                ?? httpContext.Connection.RemoteIpAddress?.ToString()
                ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromHours(1),
                QueueLimit = 0
            }));
});

// Behind ngrok / a reverse proxy: use the real client IP and scheme (trusts loopback proxies only)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
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

// Plant diagnosis: local Keras model (Flask) first, Claude vision as fallback
builder.Services.Configure<DiagnosisOptions>(builder.Configuration.GetSection("Diagnosis"));
builder.Services.Configure<LocalModelOptions>(builder.Configuration.GetSection("FlaskApi"));
builder.Services.Configure<ClaudeOptions>(builder.Configuration.GetSection("Claude"));
builder.Services.AddHttpClient(LocalModelClient.HttpClientName);
builder.Services.AddSingleton(new ModelClassMap(Path.Combine(AppContext.BaseDirectory, "Diagnosis", "model_class_map.json")));
builder.Services.AddSingleton<LocalModelClient>();
builder.Services.AddSingleton<ClaudeVisionClient>();
builder.Services.AddScoped<PlantDiagnosisService>();

// CORS — only the frontend origins listed in AllowedOrigins (appsettings*.json)
var allowedOrigins = (builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [])
    .Select(o => o.TrimEnd('/'))
    .Where(o => !string.IsNullOrWhiteSpace(o))
    .ToArray();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseForwardedHeaders();

// Global exception handler — logs full details, returns a safe message to the client
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var error = context.Features.Get<IExceptionHandlerFeature>()?.Error;

        if (error is EmailAlreadyExistsException)
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            await context.Response.WriteAsJsonAsync(new { message = "This email is already registered." });
            return;
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        if (error != null)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(error, "Unhandled exception");
        }

        // Error details only in development; never expose internals in production
        await context.Response.WriteAsJsonAsync(app.Environment.IsDevelopment()
            ? new { message = "An unexpected error occurred.", detail = error?.Message }
            : new { message = "An unexpected error occurred.", detail = (string?)null });
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseRateLimiter();

app.MapControllers();

app.Run();
