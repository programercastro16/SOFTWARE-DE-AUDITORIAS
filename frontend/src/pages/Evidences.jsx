import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Grid, Button, LinearProgress, List, ListItem, ListItemText } from '@mui/material';
import { auditService, evidenceService } from '../services/api';

const Evidences = () => {
  const [audits, setAudits] = useState([]);
  const [auditId, setAuditId] = useState('');
  const [evidences, setEvidences] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAudits = async () => {
    const data = await auditService.getAudits();
    setAudits(data || []);
    if (data?.length && !auditId) setAuditId(String(data[0].id));
  };

  const loadEvidences = async (id) => {
    if (!id) return;
    const data = await evidenceService.getEvidences(id);
    setEvidences(data || []);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await loadAudits();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    loadEvidences(auditId);
  }, [auditId]);

  const handleUpload = async () => {
    if (!auditId || !file) return;
    await evidenceService.uploadEvidence(auditId, file);
    setFile(null);
    await loadEvidences(auditId);
  };

  if (loading) return <LinearProgress sx={{ mt: 2 }} />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Evidencias</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Auditoría</InputLabel>
                <Select value={auditId} label="Auditoría" onChange={(e) => setAuditId(e.target.value)}>
                  {audits.map((a) => <MenuItem key={a.id} value={String(a.id)}>{a.title}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" fullWidth onClick={handleUpload} disabled={!file || !auditId}>Subir</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <List>
            {evidences.map((ev) => (
              <ListItem key={ev.id} divider>
                <ListItemText
                  primary={ev.file_name || ev.file_path}
                  secondary={`Fecha: ${ev.created_at || '-'} | Tipo: ${ev.file_type || '-'}`}
                />
                <Button href={`http://localhost:4000/uploads/${ev.file_path}`} target="_blank">Ver</Button>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Evidences;
