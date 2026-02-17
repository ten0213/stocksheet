import { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Stack, LinearProgress, Chip, Alert, TextField,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import dayjs from 'dayjs';
import { scrapeAll, getPrevBusinessDay, adjustToBusinessDay } from '../services/timeetfScraper';

function getChangeColor(change) {
  if (!change || change === '신규') return '#4caf50';
  const num = parseFloat(change);
  if (isNaN(num)) return 'inherit';
  if (num > 0) return '#f44336';
  if (num < 0) return '#1565c0';
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

/** 오늘/하루전 종목을 같은 행에 정렬한 통합 리스트 생성 */
function buildAlignedRows(today, yesterday) {
  const yesterdayMap = new Map();
  yesterday.forEach((s) => yesterdayMap.set(s.name, s));

  const usedNames = new Set();
  const rows = [];

  // 오늘 종목 순서 기준으로 매칭
  today.forEach((t) => {
    const y = yesterdayMap.get(t.name);
    rows.push({ today: t, yesterday: y || null });
    usedNames.add(t.name);
  });

  // 하루전에만 있는 종목 (오늘 제외된 종목)
  yesterday.forEach((y) => {
    if (!usedNames.has(y.name)) {
      rows.push({ today: null, yesterday: y });
    }
  });

  return rows;
}

/** 단일 ETF 카드: 좌(오늘) + 우(하루전) 행 정렬 */
function EtfCard({ etf, todayDate, yesterdayDate }) {
  if (etf.error) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">{etf.etfName}</Typography>
        <Alert severity="error" sx={{ mt: 1 }}>스크래핑 실패: {etf.error}</Alert>
      </Paper>
    );
  }

  const alignedRows = buildAlignedRows(etf.today, etf.yesterday);

  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      {/* ETF 이름 헤더 */}
      <Box sx={{ bgcolor: '#263238', color: 'white', px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          {etf.etfName}
        </Typography>
        <Typography variant="caption" noWrap sx={{ opacity: 0.7 }}>
          기준일 {etf.today.length}종목 | 비교일 {etf.yesterday.length}종목
        </Typography>
      </Box>

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 500 }}>
          <TableHead>
            {/* 오늘/하루전 그룹 헤더 */}
            <TableRow>
              <TableCell
                colSpan={4}
                sx={{ bgcolor: '#1565c0', color: 'white', fontWeight: 'bold', py: 0.8, textAlign: 'center', borderRight: '2px solid #fff' }}
              >
                기준일 ({todayDate})
              </TableCell>
              <TableCell
                colSpan={3}
                sx={{ bgcolor: '#78909c', color: 'white', fontWeight: 'bold', py: 0.8, textAlign: 'center' }}
              >
                비교일 ({yesterdayDate})
              </TableCell>
            </TableRow>
            {/* 컬럼 헤더 */}
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 30 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 0.5 }}>종목명</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.5, whiteSpace: 'nowrap' }}>비중(%)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.5, whiteSpace: 'nowrap', borderRight: '2px solid #e0e0e0' }}>증감</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 0.5, width: 30 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 0.5 }}>종목명</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', py: 0.5, whiteSpace: 'nowrap' }}>비중(%)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alignedRows.map((row, i) => (
              <TableRow key={i} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}>
                {/* 오늘 */}
                <TableCell sx={{ py: 0.3, color: '#999', fontSize: '0.75rem' }}>
                  {row.today ? row.today.rank : ''}
                </TableCell>
                <TableCell sx={{ py: 0.3, whiteSpace: 'nowrap', color: row.today ? 'inherit' : '#ccc' }}>
                  {row.today ? row.today.name : '-'}
                </TableCell>
                <TableCell align="right" sx={{ py: 0.3, whiteSpace: 'nowrap' }}>
                  {row.today ? `${row.today.weight}%` : '-'}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    py: 0.3,
                    whiteSpace: 'nowrap',
                    borderRight: '2px solid #e0e0e0',
                    color: row.today ? getChangeColor(row.today.change) : '#ccc',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                  }}
                >
                  {row.today ? formatChange(row.today.change) : '제외'}
                </TableCell>
                {/* 하루전 */}
                <TableCell sx={{ py: 0.3, color: '#999', fontSize: '0.75rem' }}>
                  {row.yesterday ? row.yesterday.rank : ''}
                </TableCell>
                <TableCell sx={{ py: 0.3, whiteSpace: 'nowrap', color: row.yesterday ? 'inherit' : '#ccc' }}>
                  {row.yesterday ? row.yesterday.name : '-'}
                </TableCell>
                <TableCell align="right" sx={{ py: 0.3, whiteSpace: 'nowrap' }}>
                  {row.yesterday ? `${row.yesterday.weight}%` : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default function WeeklyHoldingsView() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [compareDate, setCompareDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [scrapeData, setScrapeData] = useState(null);
  const [error, setError] = useState(null);

  // 초기 날짜를 공휴일 API 기반으로 조정
  useEffect(() => {
    (async () => {
      const today = dayjs().format('YYYY-MM-DD');
      const adjustedToday = await adjustToBusinessDay(today);
      const prevDay = await getPrevBusinessDay(adjustedToday);
      setSelectedDate(adjustedToday);
      setCompareDate(prevDay);
    })();
  }, []);

  // 기준일 변경 시 비교일 자동 업데이트
  const handleDateChange = async (newDate) => {
    setSelectedDate(newDate);
    const prevDay = await getPrevBusinessDay(newDate);
    setCompareDate(prevDay);
  };

  // 비교일 변경 시 휴장일이면 직전 개장일로 조정
  const handleCompareDateChange = async (newDate) => {
    const adjusted = await adjustToBusinessDay(newDate);
    setCompareDate(adjusted);
  };

  const handleScrape = useCallback(async () => {
    setLoading(true);
    setError(null);
    setScrapeData(null);
    try {
      const data = await scrapeAll(selectedDate, setProgress, compareDate);
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
  }, [selectedDate, compareDate]);

  const totalStocks = scrapeData?.results.reduce(
    (sum, r) => sum + (r.today?.length || 0) + (r.yesterday?.length || 0), 0
  ) || 0;

  return (
    <Box>
      {/* 상단 컨트롤 */}
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            type="date"
            label="기준일"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1, minWidth: 0 }}
          />
          <TextField
            type="date"
            label="비교일"
            value={compareDate}
            onChange={(e) => handleCompareDateChange(e.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1, minWidth: 0 }}
          />
        </Stack>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={handleScrape}
          disabled={loading}
          fullWidth
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
          기준일을 선택하고 &quot;스크래핑 시작&quot; 버튼을 눌러주세요.<br />
          비교일을 다르게 설정하면 과거 데이터도 조회할 수 있습니다.
        </Typography>
      )}
    </Box>
  );
}
