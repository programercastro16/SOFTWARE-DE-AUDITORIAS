using AuditPlatform.API.Services;
using AuditPlatform.DataAccess;
using AuditPlatform.DataAccess.Context;
using AuditPlatform.API;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtSettings = builder.Configuration.GetSection("Jwt");
var secret = jwtSettings.GetValue<string>("Secret") ?? "default_super_secret_please_change";
var issuer = jwtSettings.GetValue<string>("Issuer") ?? "AuditPlatform";
var audience = jwtSettings.GetValue<string>("Audience") ?? "AuditPlatformUsers";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
        ValidateLifetime = true,
    };
});

builder.Services.AddAuthorization();

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AuditService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5189",
                "https://localhost:7025")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();
    SqliteSchemaPatcher.Apply(dbContext);
    PostmanUsersImporter.Apply(dbContext, app.Configuration, app.Environment);
    DevDataSeeder.Apply(dbContext, app.Configuration, app.Environment);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS antes que redirección HTTPS: evita fallos en fetch desde el front (localhost:5189 → API :5141).
app.UseCors();
// En desarrollo solo escuchamos HTTP (5141); forzar HTTPS rompe llamadas del navegador a http://localhost:5141.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "uploads")),
    RequestPath = "/uploads"
});
app.MapControllers();

app.MapGet("/", () => Results.Json(new
{
    message = "API de auditorías funcionando",
    version = "1.0.0",
    timestamp = DateTime.UtcNow,
    documentation = "/swagger"
}));

app.Run();

