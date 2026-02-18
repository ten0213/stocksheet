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
      const res = await axios.post('/api/etf/scrape', null, { timeout: 60000 });

      if (!res.data || typeof res.data !== 'object') {
        setSnackbar({
          open: true,
          message: '스크래핑 실패: 서버로부터 올바른 응답을 받지 못했습니다.',
          severity: 'error',
        });
        return;
      }

      if (!res.data.totalHoldings || res.data.totalHoldings === 0) {
        setSnackbar({
          open: true,
          message: '스크래핑 완료되었으나 수집된 데이터가 없습니다. 휴장일이거나 데이터가 아직 업데이트되지 않았을 수 있습니다.',
          severity: 'warning',
        });
        onScrapeComplete?.();
        return;
      }

      setSnackbar({
        open: true,
        message: `${res.data.message || '스크래핑 완료'} (${res.data.totalHoldings}건)`,
        severity: 'success',
      });
      onScrapeComplete?.();
    } catch (err) {
      let message;
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        message = '스크래핑 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.';
      } else if (!err.response) {
        message = '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.';
      } else if (err.response.status === 403) {
        message = '접근이 거부되었습니다(403). 서버 권한 설정을 확인해 주세요.';
      } else if (err.response.status === 404) {
        message = '스크래핑 API를 찾을 수 없습니다(404). 서버 배포 상태를 확인해 주세요.';
      } else if (err.response.status >= 500) {
        message = `서버 오류가 발생했습니다(${err.response.status}). 잠시 후 다시 시도해 주세요.`;
      } else {
        message = '스크래핑 실패: ' + (err.response.data?.message || err.message);
      }
      setSnackbar({ open: true, message, severity: 'error' });
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
        autoHideDuration={snackbar.severity === 'success' ? 4000 : 6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
