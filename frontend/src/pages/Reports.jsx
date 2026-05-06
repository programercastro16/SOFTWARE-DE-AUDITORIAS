import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, LinearProgress, Table, TableHead, TableRow, TableCell, TableBody, Button, Chip } from '@mui/material';
import { auditService } from '../services/api';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [doneAudits, setDoneAudits] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const audits = await auditService.getAudits();
        setDoneAudits((audits || []).filter((a) => ['APROBADO', 'RECHAZADO', 'ENVIADO'].includes(a.status)));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LinearProgress sx={{ mt: 2 }} />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Reportes</Typography>
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Auditoría</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {doneAudits.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.title}</TableCell>
                  <TableCell><Chip size="small" label={a.status} /></TableCell>
                  <TableCell>{a.concept || '-'}</TableCell>
                  <TableCell>
                    <Button href={`http://localhost:4000/audits/${a.id}/pdf`} target="_blank" variant="outlined">Descargar PDF</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;
