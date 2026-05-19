# AuditPlatform — Proyecto final de Programación de Software

**AuditPlatform** es una aplicación web para gestionar **auditorías internas** de establecimientos (por ejemplo, bares o restaurantes). Permite crear visitas, asignar auditores, calificar un checklist de aspectos, firmar el acta y descargar un informe en PDF.

La solución está desarrollada en **C# / .NET** con arquitectura en capas, API REST con autenticación JWT y una interfaz **Razor Pages** con tema oscuro.

---

## Contenido del proyecto

| Proyecto | Descripción |
|----------|-------------|
| `AuditPlatform.Domain` | Entidades del dominio (`User`, `Audit`, `AuditItem`, `Evidence`, `Signature`) y reglas del acta (calificación CP/CR/NC, porcentajes, concepto). |
| `AuditPlatform.DataAccess` | Acceso a datos con **Entity Framework Core** y base **SQLite** (`ApplicationDbContext`). |
| `AuditPlatform.API` | API REST: login JWT, CRUD de auditorías, calificación, firmas, evidencias y generación de PDF (**QuestPDF**). |
| `AuditPlatform.Web` | Interfaz de usuario (Razor Pages + JavaScript) que consume la API. |

Archivo de solución: `AuditPlatform.slnx`

---

## Qué se implementó

### Roles de usuario

| Rol | Capacidades principales |
|-----|-------------------------|
| **ADMIN** | Crear auditorías, asignar auditor, ver todas las auditorías, eliminar auditorías, calificar acta, firmar y descargar PDF. |
| **AUDITOR** | Ver solo las auditorías asignadas, calificar el checklist, firmar y descargar PDF. No puede crear ni eliminar auditorías. |
| **CLIENTE** | Consultar auditorías según permisos definidos (vista de seguimiento). |

### Flujo de una auditoría

1. **Creación** — El administrador registra título, sede, fecha de visita, comentarios y asigna un auditor.
2. **Checklist** — Al crear la auditoría se genera automáticamente una plantilla con ~20 aspectos agrupados por categoría (instalaciones, equipos, manipulación de alimentos, etc.).
3. **Calificación del acta** — Cada aspecto se califica con:
   - **CP** (Conforme pleno) — puntaje máximo  
   - **CR** (Conforme con reparo) — puntaje parcial  
   - **NC** (No conforme) — sin puntos  
   Más observaciones por ítem.
4. **Resumen** — Se calculan progreso (% aspectos calificados), cumplimiento (% de puntos) y concepto (*Favorable*, *Favorable con requerimiento*, *Desfavorable*).
5. **Cierre** — Firma electrónica en canvas (se guarda como imagen en el servidor) y descarga del **PDF del acta** con tablas, resumen y firmas.

### Funcionalidades técnicas destacadas

- Autenticación **JWT** (Bearer token en `sessionStorage` del navegador).
- API documentada con **Swagger** en entorno de desarrollo.
- Persistencia **SQLite** con creación automática de la base al iniciar la API.
- Generación de PDF en servidor (`AuditPdfService`).
- CORS configurado entre Web (`5189`) y API (`5141`).
- Panel de resumen con métricas para administrador y auditor.
- Subida de evidencias fotográficas por auditoría (API).

---

## Requisitos previos

- **[.NET 10 SDK](https://dotnet.microsoft.com/download)** (o la versión indicada en los archivos `.csproj` del repositorio).
- Un navegador moderno (Chrome, Edge o Firefox).
- **Dos terminales** para ejecutar API y Web a la vez (o usar el depurador de Visual Studio / VS Code con dos proyectos).

---

## Cómo abrir y ejecutar el proyecto

### 1. Clonar o abrir la carpeta

Abre la raíz del repositorio en Visual Studio, VS Code o Cursor:

```text
Cursor Project/
├── AuditPlatform.slnx
├── AuditPlatform.API/
├── AuditPlatform.Web/
├── AuditPlatform.Domain/
└── AuditPlatform.DataAccess/
```

### 2. Compilar la solución

Desde la raíz del proyecto (PowerShell o CMD):

```powershell
dotnet build AuditPlatform.slnx
```

### 3. Iniciar la API (terminal 1)

```powershell
dotnet run --project AuditPlatform.API\AuditPlatform.API.csproj
```

- URL: **http://localhost:5141**
- Swagger: **http://localhost:5141/swagger**
- La base de datos se crea en `AuditPlatform.API/backend.db` al primer arranque.

Comprueba que la API responde:

```text
GET http://localhost:5141/
```

Debe devolver `"version": "2.0.0"` y la lista de `features` (`acta-pdf`, `signatures`, `delete-audit`, etc.).

### 4. Iniciar la Web (terminal 2)

```powershell
dotnet run --project AuditPlatform.Web\AuditPlatform.Web.csproj
```

- URL: **http://localhost:5189**

### 5. Usar la aplicación

1. Abre **http://localhost:5189** en el navegador.
2. Inicia sesión en **Login**.
3. Desde el inicio puedes ir a **Nueva auditoría**, **Mis auditorías** o **Resumen operativo**.
4. En el detalle de una auditoría: **Abrir acta de calificación** → guardar → **Firmar** → **Descargar PDF**.

> **Importante:** La Web llama a la API en `http://localhost:5141`. Si la API no está en marcha, el login y las listas fallarán. Tras cambios en la API, reiníciala; en la Web usa **Ctrl+F5** para recargar sin caché.

---

## Usuarios de prueba

### Administrador por defecto (primera ejecución)

Si la base está vacía, en desarrollo se crea un admin automáticamente (`appsettings.Development.json`):

| Campo | Valor |
|-------|--------|
| Correo | `admin@local.dev` |
| Contraseña | `Admin123!` |

### Importar más usuarios (opcional)

Copia el archivo de ejemplo y edítalo con tus datos:

```powershell
copy AuditPlatform.API\postman-users.import.sample.json AuditPlatform.API\postman-users.json
```

Edita `postman-users.json` con correos, contraseñas y roles (`ADMIN`, `AUDITOR`, `CLIENTE`). Al reiniciar la API, los usuarios nuevos se importan si el correo no existe ya.

---

## Estructura de pantallas (Web)

| Ruta | Descripción |
|------|-------------|
| `/Login` | Inicio de sesión |
| `/` | Página de inicio con accesos rápidos |
| `/Dashboard` | Resumen (admin: crear + listado; auditor: solo asignadas) |
| `/Auditorias` | Listado de auditorías |
| `/Auditorias/Nueva` | Formulario de nueva auditoría (solo ADMIN) |
| `/Auditorias/Detalle/{id}` | Acta, firma, PDF y eliminación |

---

## API — Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/login` | Login (devuelve JWT) |
| `GET` | `/audits` | Listar auditorías (filtrado por rol) |
| `POST` | `/audits` | Crear auditoría + checklist |
| `PUT` | `/audits/{id}/items` | Guardar calificaciones del acta |
| `POST` | `/audits/{id}/signatures` | Guardar firma |
| `GET` | `/audits/{id}/pdf` | Descargar PDF del acta |
| `DELETE` | `/audits/{id}` | Eliminar auditoría (solo ADMIN) |

La documentación completa está en Swagger con la API en ejecución.

---

## Solución de problemas frecuentes

| Problema | Qué hacer |
|----------|-----------|
| Error al compilar la API (`archivo en uso`) | Cierra la terminal donde corre la API (Ctrl+C) y vuelve a compilar. |
| No aparece eliminar / PDF / firma | Reinicia la API y verifica `GET /` → versión **2.0.0**. |
| Métricas en "—" o datos viejos | Borra `AuditPlatform.API/backend.db` y reinicia (se recrea la base). |
| Login falla | Comprueba que la API esté en **5141** y las credenciales sean correctas. |

---

## Tecnologías utilizadas

- **ASP.NET Core** — API y Razor Pages  
- **Entity Framework Core** + **SQLite**  
- **JWT Bearer** — Autenticación  
- **QuestPDF** — Generación de PDF  
- **Swagger** — Documentación de la API  
- **HTML / CSS / JavaScript** — Interfaz del acta (modal, firma en canvas)

---

## Autor y materia

Proyecto desarrollado como entrega final de la materia **Programación de Software**.

Para la demostración en clase: mostrar login con distintos roles, creación de auditoría, calificación del acta, firma y descarga del PDF generado.
