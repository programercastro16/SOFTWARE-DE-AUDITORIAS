import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:4000';

function computeConcept(percent) {
  if (percent >= 90) return 'Favorable';
  if (percent >= 60) return 'Favorable con requerimiento';
  return 'Desfavorable';
}

function ToastHost({ toasts, onRemove }) {
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <strong>{t.title}</strong>
          {t.message ? <span>{t.message}</span> : null}
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <button className="btn btn-ghost btn-small" onClick={() => onRemove(t.id)}>
              Cerrar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditDetailsModal({
  open,
  audit,
  token,
  onClose,
  onSaved,
  pushToast,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [evidences, setEvidences] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!open || !audit) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/audits/${audit.id}/items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled) {
          if (res.ok) setItems(data);
          else pushToast('error', 'No se pudieron cargar ítems', data.error || '');
        }
        const evRes = await fetch(`${API_URL}/audits/${audit.id}/evidences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const evData = await evRes.json();
        if (!cancelled && evRes.ok && Array.isArray(evData)) {
          setEvidences(evData);
        }
      } catch (e) {
        if (!cancelled) pushToast('error', 'Error de red', 'No se pudo cargar el detalle.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, audit?.id]);

  if (!open || !audit) return null;

  const totalWeight = items.reduce((acc, it) => acc + (Number(it.weight) || 0), 0);
  const totalScore = items.reduce((acc, it) => acc + (Number(it.score) || 0), 0);
  const percent = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  const concept = computeConcept(percent);

  const grouped = items.reduce((acc, it) => {
    const key = it.category || 'OTROS';
    if (!acc[key]) acc[key] = [];
    acc[key].push(it);
    return acc;
  }, {});

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const saveItems = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/audits/${audit.id}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((it) => ({
            id: it.id,
            score: Number(it.score) || 0,
            observations: it.observations || '',
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast('error', 'No se pudo guardar', data.error || '');
        return;
      }
      setItems(data);
      pushToast('success', 'Guardado', 'Puntajes y observaciones actualizados.');
      onSaved?.();
    } catch (e) {
      pushToast('error', 'Error de red', 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const uploadEvidence = async () => {
    if (!file) {
      pushToast('error', 'Falta archivo', 'Selecciona una foto o evidencia.');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_URL}/audits/${audit.id}/evidences`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast('error', 'No se pudo subir evidencia', data.error || '');
        return;
      }
      setFile(null);
      setEvidences((prev) => [data, ...prev]);
      pushToast('success', 'Evidencia subida', `Guardado: ${data.file_path}`);
    } catch (e) {
      pushToast('error', 'Error de red', 'No se pudo subir evidencia.');
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            <strong>
              Auditoría #{audit.id} · {audit.title}
            </strong>
            <span>{audit.created_at}</span>
          </div>
          <div className="actions">
            <button className="btn btn-ghost" onClick={onClose}>
              Cerrar
            </button>
            <button className="btn btn-primary" disabled={saving || loading} onClick={saveItems}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="panel panel-instructions">
            <h4>Instrucciones e información del administrador</h4>
            {audit.scheduled_visit_date && (
              <p className="visit-date-futuristic">
                <span className="visit-date-label">Fecha de visita programada</span>
                {new Date(audit.scheduled_visit_date + 'T12:00:00').toLocaleDateString('es-CO', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
            {audit.description ? (
              <div className="admin-description">
                <span className="visit-date-label">Descripción / sede / notas:</span>
                <p>{audit.description}</p>
              </div>
            ) : (
              <p className="hint">Sin descripción adicional.</p>
            )}
          </div>

          <div className="panel">
            <h4>Puntaje y observaciones</h4>
            <div className="hint">
              Edita el “score” de cada ítem. El PDF usará estos valores para calcular el % de
              cumplimiento.
            </div>
            <div className="divider" />

            {loading ? (
              <p className="hint">Cargando ítems…</p>
            ) : (
              Object.entries(grouped).map(([category, list]) => (
                <div key={category} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
                    {category}
                  </div>
                  <div className="items-grid">
                    <div className="head">Código</div>
                    <div className="head">Aspecto</div>
                    <div className="head">Score</div>
                    <div className="head">Observación</div>

                    {list.map((it) => (
                      <React.Fragment key={it.id}>
                        <div className="code">{it.code}</div>
                        <div className="label">{it.label}</div>
                        <div className="scoreWrap">
                          <input
                            className="input"
                            style={{ padding: '6px 8px' }}
                            type="number"
                            step="0.5"
                            min="0"
                            max={it.weight}
                            value={it.score ?? 0}
                            onChange={(e) => updateItem(it.id, { score: e.target.value })}
                          />
                          <span className="hint">/ {it.weight}</span>
                        </div>
                        <input
                          className="input"
                          style={{ padding: '6px 8px' }}
                          value={it.observations || ''}
                          onChange={(e) => updateItem(it.id, { observations: e.target.value })}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="panel">
            <h4>Resumen</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div className="hint">Cumplimiento</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{percent.toFixed(1)}%</div>
                <div className="hint">Concepto: {concept}</div>
              </div>
              <div style={{ minWidth: 180 }}>
                <div className="hint" style={{ marginBottom: 6 }}>
                  Progreso
                </div>
                <div className="progress">
                  <div style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
                </div>
                <div className="hint" style={{ marginTop: 6 }}>
                  Score total: {totalScore.toFixed(1)} / {totalWeight.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="divider" />

            <h4>Evidencias</h4>
            <div className="hint" style={{ marginBottom: 10 }}>
              Sube una foto o archivo para adjuntarlo a esta auditoría.
            </div>
            <input
              className="input"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn btn-secondary" type="button" onClick={uploadEvidence}>
                Subir evidencia
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setFile(null)}>
                Limpiar
              </button>
            </div>

            {evidences.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="hint" style={{ marginBottom: 6 }}>
                  Evidencias guardadas para esta auditoría
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 8,
                  }}
                >
                  {evidences.map((ev) => {
                    const url = `${API_URL}/${(ev.file_path || '').replace(/\\/g, '/')}`;
                    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(ev.file_path || '');
                    return (
                      <a
                        key={ev.id}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="evidence-thumb"
                      >
                        {isImage ? (
                          <img
                            src={url}
                            alt="Evidencia"
                            style={{
                              width: '100%',
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 6,
                              border: '1px solid rgba(148, 163, 184, 0.6)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: 80,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                              border: '1px solid rgba(148, 163, 184, 0.6)',
                              fontSize: 11,
                              padding: 4,
                              textAlign: 'center',
                            }}
                          >
                            Ver archivo
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="divider" />

            <div className="hint">
              Tip: después de guardar cambios aquí, descarga el PDF y verás los puntajes reflejados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error de login');
        return;
      }
      onLogin(data);
    } catch (err) {
      setError('Error de red');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <h2>Ingresar a auditorías</h2>
          <p>Controla tus actas internas en un solo lugar.</p>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Contraseña</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p style={{ color: '#f97373', fontSize: 12, marginTop: -2 }}>{error}</p>
          )}
          <button type="submit" className="btn btn-primary">
            Entrar
          </button>
        </form>
        <p className="login-footer-text">
          Primero debes crear un usuario administrador a través de <code>/auth/register-admin</code>{' '}
          usando Postman.
        </p>
        <p className="copyright-login">© {new Date().getFullYear()} Creado por Thomas Castro Giraldo</p>
      </div>
    </div>
  );
}

function Dashboard({ token, user, onLogout }) {
  const [audits, setAudits] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledVisitDate, setScheduledVisitDate] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [workers, setWorkers] = useState([]);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const pushToast = (type, title, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [{ id, type, title, message }, ...prev].slice(0, 3));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const loadAudits = async () => {
    const res = await fetch(`${API_URL}/audits`, { headers: authHeaders });
    const data = await res.json();
    if (res.ok) setAudits(data);
  };

  const loadMetrics = async () => {
    const res = await fetch(`${API_URL}/audits/dashboard/metrics`, {
      headers: authHeaders,
    });
    const data = await res.json();
    if (res.ok) setMetrics(data);
  };

  useEffect(() => {
    loadAudits();
    loadMetrics();
    if (user.role === 'ADMIN') {
      fetch(`${API_URL}/auth/users`, { headers: authHeaders })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setWorkers(data);
        })
        .catch(() => {});
    }
  }, []);

  const handleDownloadPdf = async (auditId) => {
    try {
      const res = await fetch(`${API_URL}/audits/${auditId}/pdf`, {
        headers: authHeaders,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        pushToast('error', 'PDF no disponible', data.error || 'No autorizado.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-${auditId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      pushToast('success', 'PDF descargado', `Audit #${auditId}`);
    } catch (e) {
      pushToast('error', 'Error de red', 'No se pudo descargar el PDF.');
    }
  };

  const openDetails = (audit) => {
    setSelectedAudit(audit);
    setDetailOpen(true);
  };

  const updateStatus = async (audit, status) => {
    try {
      const res = await fetch(`${API_URL}/audits/${audit.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast('error', 'No se pudo cambiar estado', data.error || '');
        return;
      }
      setAudits((prev) => prev.map((a) => (a.id === audit.id ? data : a)));
      loadMetrics();
      pushToast('success', 'Estado actualizado', `Ahora está en ${status}.`);
    } catch (e) {
      pushToast('error', 'Error de red', 'No se pudo actualizar el estado.');
    }
  };

  const deleteAudit = async (audit) => {
    if (!window.confirm(`¿Eliminar auditoría #${audit.id}? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/audits/${audit.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        pushToast('error', 'No se pudo eliminar', data.error || '');
        return;
      }
      setAudits((prev) => prev.filter((a) => a.id !== audit.id));
      loadMetrics();
      pushToast('success', 'Auditoría eliminada', `ID #${audit.id}`);
    } catch (e) {
      pushToast('error', 'Error de red', 'No se pudo eliminar la auditoría.');
    }
  };

  const handleCreateAudit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/audits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        title,
        description,
        scheduled_visit_date: scheduledVisitDate || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setTitle('');
      setDescription('');
      setScheduledVisitDate('');
      setAudits((prev) => [data, ...prev]);
      loadMetrics();
      pushToast('success', 'Auditoría creada', `ID #${data.id}`);
    } else {
      pushToast('error', 'No se pudo crear', data.error || '');
    }
  };

  const filtered = audits.filter((a) => {
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      String(a.id).includes(q) ||
      (a.title || '').toLowerCase().includes(q) ||
      (a.created_by_name || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' ? true : a.status === statusFilter;
    return matchQ && matchStatus;
  });

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-logo">
          <div className="app-logo-icon">A</div>
          <div>
            <div className="app-logo-text-title">Auditorías Internas</div>
            <div className="app-logo-text-sub">Formato EPS001 digital</div>
          </div>
        </div>
        <div>
          <div className="sidebar-section-title">Panel</div>
          <div className="sidebar-menu">
            <div className="sidebar-pill primary">
              <span>Dashboard general</span>
              <span className="sidebar-tag">En vivo</span>
            </div>
            <div className="sidebar-pill">
              <span>Actas generadas</span>
              <span>{audits.length}</span>
            </div>
          </div>
        </div>
        <div className="sidebar-footer">
          <div>Versión 1.0 · React + Node</div>
          <div>Base de datos local con respaldo.</div>
          <div className="copyright">© {new Date().getFullYear()} Creado por Thomas Castro Giraldo</div>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div className="header-titles">
            <h1>Dashboard de Auditorías</h1>
            <p>Registra, puntúa y genera el acta en PDF con el formato institucional.</p>
          </div>
          <div className="header-user">
            <div className="user-chip">
              {user.name} · <strong>{user.role}</strong>
            </div>
            <button
              className="btn btn-ghost btn-danger"
              onClick={() => {
                if (window.confirm('¿Cerrar sesión?')) onLogout();
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <div className="top-tools">
          <div className="tool-row">
            <input
              className="input toolbar-input"
              placeholder="Buscar por ID, título o usuario..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              className={`chip ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
              type="button"
            >
              Todos
            </button>
            {['BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO'].map((s) => (
              <button
                key={s}
                className={`chip ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="hint">Mostrando: {filtered.length} / {audits.length}</div>
        </div>

        <div className="layout-grid">
          {user.role === 'ADMIN' && (
            <section className="card">
              <div className="card-header">
                <h3>Crear nueva auditoría</h3>
                <span>Establecimiento, sede y fecha</span>
              </div>
              <form onSubmit={handleCreateAudit} className="form-grid">
                <div className="form-field">
                  <label>Título (ej: Cuzco)</label>
                  <input
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Fecha de visita programada</label>
                  <div className="date-picker-wrap">
                    <input
                      type="date"
                      className="input input-date-futuristic"
                      value={scheduledVisitDate}
                      onChange={(e) => setScheduledVisitDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                    />
                    <span className="date-picker-icon">📅</span>
                  </div>
                </div>
                <div className="form-field">
                  <label>Descripción / sede / instrucciones (visible para el asignado)</label>
                  <textarea
                    className="textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Sede, dirección, notas para quien realice la auditoría..."
                  />
                </div>
                <div className="card-footer">
                  <button type="submit" className="btn btn-primary">
                    Guardar auditoría
                  </button>
                </div>
              </form>
            </section>
          )
          }

          <section className="card">
            <div className="card-header">
              <h3>Métricas rápidas</h3>
              <span>Resumen de actas registradas</span>
            </div>
            {metrics ? (
              <div className="metrics-grid">
                <div className="metric-pill">
                  <span className="metric-label">Total de auditorías</span>
                  <span className="metric-value">{metrics.total_audits}</span>
                  <span className="metric-sub">Actas registradas</span>
                </div>
                {metrics.by_status.map((s) => (
                  <div key={s.status} className="metric-pill">
                    <span className="metric-label">{s.status}</span>
                    <span className="metric-value">{s.count}</span>
                    <span className="metric-sub">actas</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando métricas...</p>
            )}
          </section>
        </div>

        <section className="card">
          <div className="card-header">
            <h3>Auditorías recientes</h3>
            <span>Descarga el PDF en formato EPS001</span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Fecha visita</th>
                  {user.role === 'ADMIN' && <th>Asignado a</th>}
                  <th>Estado</th>
                  <th>Creado por</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.title}</td>
                    <td className="date-cell">
                      {a.scheduled_visit_date
                        ? new Date(a.scheduled_visit_date + 'T12:00:00').toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    {user.role === 'ADMIN' && (
                      <td>
                        <select
                          className="input"
                          style={{ padding: '4px 6px', width: 160, fontSize: 11 }}
                          value={a.assigned_to_user_id ? String(a.assigned_to_user_id) : ''}
                          onChange={async (e) => {
                            const uid = e.target.value;
                            try {
                              if (!uid) {
                                const res = await fetch(
                                  `${API_URL}/audits/${a.id}/assign`,
                                  { method: 'DELETE', headers: authHeaders }
                                );
                                if (!res.ok && res.status !== 204) {
                                  const data = await res.json().catch(() => ({}));
                                  pushToast('error', 'No se pudo quitar asignación', data.error || '');
                                  return;
                                }
                                pushToast('success', 'Asignación quitada', `Auditoría #${a.id}`);
                              } else {
                                const res = await fetch(
                                  `${API_URL}/audits/${a.id}/assign`,
                                  {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      ...authHeaders,
                                    },
                                    body: JSON.stringify({ userId: Number(uid) }),
                                  }
                                );
                                const data = await res.json();
                                if (!res.ok) {
                                  pushToast('error', 'No se pudo asignar', data.error || '');
                                  return;
                                }
                                pushToast('success', 'Asignada', `Solo esta auditoría (#${a.id}) fue asignada.`);
                              }
                              loadAudits();
                            } catch {
                              pushToast('error', 'Error de red', 'No se pudo actualizar la asignación.');
                            }
                          }}
                        >
                          <option value="">Sin asignar</option>
                          {workers.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({w.role})
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td>
                      <span className="status-pill">{a.status}</span>
                    </td>
                    <td>{a.created_by_name}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {a.created_at ? new Date(a.created_at).toLocaleString('es-CO', { dateStyle: 'short' }) : '—'}
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => openDetails(a)}
                        >
                          Detalles
                        </button>
                        {user.role === 'ADMIN' && (
                          <select
                            className="input"
                            style={{ padding: '4px 6px', width: 120, fontSize: 11 }}
                            value={a.status}
                            onChange={(e) => updateStatus(a, e.target.value)}
                          >
                            <option value="BORRADOR">Borrador</option>
                            <option value="ENVIADO">Enviado</option>
                            <option value="APROBADO">Aprobado</option>
                            <option value="RECHAZADO">Rechazado</option>
                          </select>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary btn-small"
                          onClick={() => handleDownloadPdf(a.id)}
                        >
                          PDF
                        </button>
                        {user.role === 'ADMIN' && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-small"
                            onClick={() => deleteAudit(a)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={user.role === 'ADMIN' ? 8 : 7} style={{ padding: 14, fontSize: 12, color: '#9ca3af' }}>
                      No hay resultados para ese filtro/búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <AuditDetailsModal
          open={detailOpen}
          audit={selectedAudit}
          token={token}
          onClose={() => setDetailOpen(false)}
          onSaved={() => loadMetrics()}
          pushToast={pushToast}
        />
        <ToastHost toasts={toasts} onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

        <footer className="app-footer">
          © {new Date().getFullYear()} Creado por Thomas Castro Giraldo
        </footer>
      </main>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('audit_session');
    return raw ? JSON.parse(raw) : null;
  });

  const handleLogin = (data) => {
    localStorage.setItem('audit_session', JSON.stringify(data));
    setSession(data);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('audit_session');
    setSession(null);
    navigate('/');
  };

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Dashboard
            token={session.token}
            user={session.user}
            onLogout={handleLogout}
          />
        }
      />
    </Routes>
  );
}

export default App;

