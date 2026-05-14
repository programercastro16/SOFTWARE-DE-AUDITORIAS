using AuditPlatform.Domain.Entities;

namespace AuditPlatform.API.Services;

/// <summary>
/// Plantilla digital tipo checklist de auditoría de sede (rúbrica genérica).
/// Puedes ajustar textos cuando tengas el PDF como referencia literal.
/// </summary>
internal static class AuditChecklistTemplate
{
    public static List<AuditItem> BuildItems()
    {
        return
        [
            new AuditItem { Code = "A1", Label = "Infraestructura y condiciones del local", Weight = 8, Category = "INSTALACIONES" },
            new AuditItem { Code = "A2", Label = "Personal: uniformes, higiene y capacitación", Weight = 8, Category = "PERSONAL" },
            new AuditItem { Code = "A3", Label = "Control de plagas y dispositivos", Weight = 7, Category = "INSTALACIONES" },
            new AuditItem { Code = "B1", Label = "Almacenamiento de materias primas e insumos", Weight = 8, Category = "OPERACIÓN" },
            new AuditItem { Code = "B2", Label = "Temperaturas y cadena de frío", Weight = 9, Category = "OPERACIÓN" },
            new AuditItem { Code = "B3", Label = "Rotulación, fechas de vencimiento y FEFO/FIFO", Weight = 7, Category = "OPERACIÓN" },
            new AuditItem { Code = "C1", Label = "Limpieza de áreas, equipos y utensilios", Weight = 9, Category = "HIGIENE" },
            new AuditItem { Code = "C2", Label = "Desinfección y químicos autorizados", Weight = 7, Category = "HIGIENE" },
            new AuditItem { Code = "D1", Label = "Registros HACCP / BPM y bitácoras", Weight = 8, Category = "DOCUMENTACIÓN" },
            new AuditItem { Code = "D2", Label = "Trazabilidad de lotes y retención de muestras", Weight = 8, Category = "DOCUMENTACIÓN" },
            new AuditItem { Code = "E1", Label = "Manejo de residuos y áreas de cuarentena", Weight = 6, Category = "GESTIÓN" },
            new AuditItem { Code = "E2", Label = "Instalaciones sanitarias y suministro de agua", Weight = 6, Category = "INSTALACIONES" },
            new AuditItem { Code = "F1", Label = "Calibración de equipos de medición", Weight = 4, Category = "EQUIPOS" },
            new AuditItem { Code = "F2", Label = "Plan de acción ante hallazgos y seguimiento", Weight = 5, Category = "MEJORA" }
        ];
    }
}
