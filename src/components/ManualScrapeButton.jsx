import { useState } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  CircularProgress, Snackbar, Alert, Box, Typography, Chip, Stack
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

const STATUS_CONFIG = {
  SCRAPED: { label: '성공', color: 'success' },
  ALREADY_EXISTS: { label: '이미 존재', color: 'info' },
  EMPTY: { label: '데이터 없음', color: 'warning' },
  FAILED: { label: '실패', color: 'error' },
};

export default function ManualScrapeButton({ onScrapeComplete }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [resultDialog, setResultDialog] = useState({ open: false, details: [], date: '' });

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

      const { totalNewHoldings, details, date } = res.data;
      const failedDetails = details?.filter((d) => d.status === 'FAILED') || [];
      const emptyDetails = details?.filter((d) => d.status === 'EMPTY') || [];
      const hasProblems = failedDetails.length > 0 || emptyDetails.length > 0;

      if (failedDetails.length === details?.length) {
        // 전체 실패
        setSnackbar({
          open: true,
          message: '모든 ETF 스크래핑에 실패했습니다. 외부 사이트 상태를 확인해 주세요.',
          severity: 'error',
        });
        setResultDialog({ open: true, details: details || [], date: date || '' });
        onScrapeComplete?.();
        return;
      }

      if (totalNewHoldings === 0 && !hasProblems) {
        setSnackbar({
          open: true,
          message: '스크래핑 완료되었으나 새로 수집된 데이터가 없습니다. 이미 수집되었거나 휴장일일 수 있습니다.',
          severity: 'warning',
        });
        onScrapeComplete?.();
        return;
      }

      if (hasProblems) {
        // 일부 성공, 일부 실패
        const failedNames = [...failedDetails, ...emptyDetails].map((d) => d.etfName).join(', ');
        setSnackbar({
          open: true,
          message: `스크래핑 부분 완료 (${totalNewHoldings}건). 일부 ETF 실패: ${failedNames}`,
          severity: 'warning',
        });
        setResultDialog({ open: true, details: details || [], date: date || '' });
      } else {
        setSnackbar({
          open: true,
          message: `${res.data.message || '스크래핑 완료'} (${totalNewHoldings}건)`,
          severity: 'success',
        });
      }

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

      <Dialog
        open={resultDialog.open}
        onClose={() => setResultDialog((s) => ({ ...s, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>스크래핑 결과 상세 ({resultDialog.date})</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {resultDialog.details.map((detail, idx) => {
              const config = STATUS_CONFIG[detail.status] || { label: detail.status, color: 'default' };
              return (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={config.label} color={config.color} size="small" sx={{ minWidth: 80 }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    <strong>{detail.etfName}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {detail.message}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialog((s) => ({ ...s, open: false }))}>확인</Button>
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
