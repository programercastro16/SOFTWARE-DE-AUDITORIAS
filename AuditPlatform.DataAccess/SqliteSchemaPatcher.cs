using System.Data;
using System.Data.Common;
using AuditPlatform.DataAccess.Context;
using Microsoft.EntityFrameworkCore;

namespace AuditPlatform.DataAccess;

/// <summary>
/// SQLite + <see cref="DbContext.Database.EnsureCreated"/> no actualiza tablas ya existentes.
/// Si el modelo añade columnas, la API falla al consultar. Este parche añade columnas faltantes en desarrollo.
/// </summary>
public static class SqliteSchemaPatcher
{
    public static void Apply(ApplicationDbContext db)
    {
        if (!db.Database.IsSqlite())
            return;

        var conn = db.Database.GetDbConnection();
        var wasOpen = conn.State == ConnectionState.Open;
        if (!wasOpen)
            conn.Open();

        try
        {
            foreach (var (table, col, def) in ColumnsToEnsure)
            {
                if (ColumnExists(conn, table, col))
                    continue;
                Execute(conn, $"ALTER TABLE \"{table}\" ADD COLUMN \"{col}\" {def}");
            }
        }
        finally
        {
            if (!wasOpen && conn.State == ConnectionState.Open)
                conn.Close();
        }
    }

    private static readonly (string Table, string Column, string SqliteDef)[] ColumnsToEnsure =
    [
        ("Audits", "InternalName", "TEXT NULL"),
        ("Audits", "Sede", "TEXT NOT NULL DEFAULT ''"),
        ("Audits", "Comments", "TEXT NULL"),
        ("Audits", "Description", "TEXT NULL"),
        ("Audits", "AssignedToUserId", "INTEGER NULL"),
        ("Audits", "ScheduledVisitDate", "TEXT NULL"),
        ("AuditItems", "Category", "TEXT NULL"),
        ("AuditItems", "Observations", "TEXT NULL"),
        ("AuditItems", "PointsA", "REAL NOT NULL DEFAULT 0"),
        ("AuditItems", "PointsAR", "REAL NOT NULL DEFAULT 0"),
        ("AuditItems", "PointsI", "REAL NOT NULL DEFAULT 0"),
    ];

    private static bool ColumnExists(DbConnection conn, string table, string column)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"PRAGMA table_info(\"{table}\");";
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            var name = r.GetString(1);
            if (string.Equals(name, column, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static void Execute(DbConnection conn, string sql)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        cmd.ExecuteNonQuery();
    }
}
