import { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Stack, LinearProgress, Chip, Alert, TextField,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import dayjs from 'dayjs';
import { scrapeAll, getPrevBusinessDay } from '../services/timeetfScraper';

function getChangeColor(change) {
  if (!change || change === '신규') return '#4caf50';
  const num = parseFloat(change);
  if (isNaN(num)) return 'inherit';
  if (num > 0) return '#4caf50';
  if (num < 0) return '#f44336';
  return '#888';
}

function formatChange(change) {
  if (!change) return '-';
  if (change === '신규') return '신규';
  const num = parseFloat(change);
  if (isNaN(num)) return change;
  if (num === 0) return '0.00%';
  return num > 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`;
}

/** 단일 ETF 카드: 좌(오늘) + 우(하루전) 박스 */
function EtfCard({ etf, todayDate, yesterdayDate }) {
  if (etf.error) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">{etf.etfName}</Typography>
        <Alert severity="error" sx={{ mt: 1 }}>스크래핑 실패: {etf.error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      {/* ETF 이름 헤더 */}
      <Box sx={{ bgcolor: '#263238', color: 'white', px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          {etf.etfName}
        </Typography>
        <Typography variant="caption" noWrap sx={{ opacity: 0.7 }}>
          오늘 {etf.today.length}종목 | 하루전 {etf.yesterday.length}종목
        </Typography>
      </Box>

      {/* 좌우 2박스 */}
      <Stack direction="row" sx={{ minHeight: 200, overflowX: 'auto' }}>
        {/* 왼쪽: 오늘 */}
        <Box sx={{ flex: 1, minWidth: 250, borderRight: '1px solid #e0e0e0' }}>
          <Box sx={{ bgcolor: '#1565c0', color: 'white', px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight="bold">오늘</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>{todayDate}</Typography>
          </Box>
          <Box sx={{ px: 1, py: 0.5, bgcolor: '#f5f5f5', fontSize: '0.7rem', color: '#888' }}>
            * 증감: 하루전 대비 비중 변화
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 30 }}></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5 }}>종목명</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.5 }}>비중(%)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.5 }}>증감*</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {etf.today.map((stock) => (
                  <TableRow key={stock.rank} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}>
                    <TableCell sx={{ py: 0.3, color: '#999', fontSize: '0.75rem' }}>{stock.rank}</TableCell>
                    <TableCell sx={{ py: 0.3, whiteSpace: 'nowrap' }}>{stock.name}</TableCell>
                    <TableCell align="right" sx={{ py: 0.3, whiteSpace: 'nowrap' }}>{stock.weight}%</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        py: 0.3,
                        whiteSpace: 'nowrap',
                        color: getChangeColor(stock.change),
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                      }}
                    >
                      {formatChange(stock.change)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* 오른쪽: 하루전 */}
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Box sx={{ bgcolor: '#f5f5f5', px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="body2" fontWeight="bold">하루전</Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>{yesterdayDate}</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 30 }}></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 0.5 }}>종목명</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.5 }}>비중(%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {etf.yesterday.map((stock) => (
                  <TableRow key={stock.rank} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}>
                    <TableCell sx={{ py: 0.3, color: '#999', fontSize: '0.75rem' }}>{stock.rank}</TableCell>
                    <TableCell sx={{ py: 0.3, whiteSpace: 'nowrap' }}>{stock.name}</TableCell>
                    <TableCell align="right" sx={{ py: 0.3, whiteSpace: 'nowrap' }}>{stock.weight}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function WeeklyHoldingsView() {
  const [selectedDate, setSelectedDate] = useState(
    dayjs().day() === 0 || dayjs().day() === 6
      ? getPrevBusinessDay(dayjs().format('YYYY-MM-DD'))
      : dayjs().format('YYYY-MM-DD')
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [scrapeData, setScrapeData] = useState(null);
  const [error, setError] = useState(null);

  const handleScrape = useCallback(async () => {
    setLoading(true);
    setError(null);
    setScrapeData(null);
    try {
      const data = await scrapeAll(selectedDate, setProgress);
      setScrapeData(data);

      const errors = data.results.filter((r) => r.error);
      if (errors.length > 0) {
        setError(errors.map((e) => `${e.etfName}: ${e.error}`).join(', '));
      }
    } catch (err) {
      setError('스크래핑 실패: ' + err.message);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [selectedDate]);

  const totalStocks = scrapeData?.results.reduce(
    (sum, r) => sum + (r.today?.length || 0) + (r.yesterday?.length || 0), 0
  ) || 0;

  return (
    <Box>
      {/* 상단 컨트롤 */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <TextField
          type="date"
          label="기준일 (오늘)"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: { xs: 150, sm: 180 } }}
        />
        <Typography variant="body2" color="text.secondary" noWrap>
          하루전: {getPrevBusinessDay(selectedDate)}
        </Typography>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={handleScrape}
          disabled={loading}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {loading ? '스크래핑 중...' : '스크래핑 시작'}
        </Button>
      </Stack>

      {/* 로딩 진행 */}
      {loading && progress && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {progress.etfName} 처리 중... ({progress.current}/{progress.total})
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(progress.current / progress.total) * 100}
          />
        </Box>
      )}

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* 결과 요약 칩 */}
      {scrapeData && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
          <Chip label={`총 ${totalStocks}건`} color="info" size="small" />
          {scrapeData.results.map((r) => (
            <Chip
              key={r.etfName}
              label={`${r.etfName.replace('TIME ', '')} ${r.error ? '실패' : `${r.today.length}종목`}`}
              color={r.error ? 'error' : 'success'}
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>
      )}

      {/* ETF별 카드 */}
      {scrapeData?.results.map((etf) => (
        <EtfCard
          key={etf.etfName}
          etf={etf}
          todayDate={scrapeData.todayDate}
          yesterdayDate={scrapeData.yesterdayDate}
        />
      ))}

      {/* 빈 상태 */}
      {!loading && !scrapeData && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          기준일을 선택하고 &quot;스크래핑 시작&quot; 버튼을 눌러주세요.
        </Typography>
      )}
    </Box>
  );
}
