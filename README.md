# AuditPlatform (solo C#)

Solución .NET con capas claras y una interfaz Razor Pages.

## Estructura

| Carpeta | Rol |
|--------|-----|
| `AuditPlatform.Domain` | Entidades e interfaces del dominio |
| `AuditPlatform.DataAccess` | Entity Framework Core y `ApplicationDbContext` |
| `AuditPlatform.API` | API REST (JWT, SQLite, Swagger) |
| `AuditPlatform.Web` | Interfaz web (ASP.NET Core Razor Pages) |

## Requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)

## Compilar

Desde la raíz del repositorio:

```powershell
dotnet build AuditPlatform.slnx
```

## Ejecutar en desarrollo

En dos terminales (API y web usan puertos distintos definidos en `Properties/launchSettings.json`):

```powershell
dotnet run --project AuditPlatform.API\AuditPlatform.API.csproj
```

```powershell
dotnet run --project AuditPlatform.Web\AuditPlatform.Web.csproj
```

- API: `http://localhost:5141` (Swagger en `/swagger` en entorno Development).
- Web: `http://localhost:5189` (perfil `http` en `AuditPlatform.Web`).

La base de datos SQLite se crea al arrancar la API (`EnsureCreated`) en `AuditPlatform.API/backend.db` (cadena de conexión en `appsettings.json`).
