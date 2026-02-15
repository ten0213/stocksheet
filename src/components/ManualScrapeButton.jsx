import { useState } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  CircularProgress, Snackbar, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

export default function ManualScrapeButton({ onScrapeComplete }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleScrape = async () => {
    setOpen(false);
    setLoading(true);
    try {
      const res = await axios.post('/api/etf/scrape');
      setSnackbar({
        open: true,
        message: `${res.data.message} (${res.data.totalHoldings}건)`,
        severity: 'success',
      });
      onScrapeComplete?.();
    } catch (err) {
      setSnackbar({
        open: true,
        message: '스크래핑 실패: ' + (err.response?.data?.message || err.message),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        {loading ? '스크래핑 중...' : '수동 스크래핑'}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>수동 스크래핑</DialogTitle>
        <DialogContent>
          <DialogContentText>
            5개 ETF의 구성종목 데이터를 지금 수집하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button onClick={handleScrape} variant="contained" autoFocus>
            실행
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
