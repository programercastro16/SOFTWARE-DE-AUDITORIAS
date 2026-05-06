import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, Alert } from '@mui/material';

const Settings = () => {
  const [form, setForm] = useState({
    companyName: localStorage.getItem('companyName') || '',
    appTitle: localStorage.getItem('appTitle') || 'Audit Platform'
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem('companyName', form.companyName);
    localStorage.setItem('appTitle', form.appTitle);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Configuración</Typography>
      {saved && <Alert sx={{ mb: 2 }} severity="success">Configuración guardada.</Alert>}
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de empresa"
                value={form.companyName}
                onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Título de aplicación"
                value={form.appTitle}
                onChange={(e) => setForm((p) => ({ ...p, appTitle: e.target.value }))}
              />
            </Grid>
          </Grid>
          <Button sx={{ mt: 2 }} variant="contained" onClick={save}>Guardar</Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;
