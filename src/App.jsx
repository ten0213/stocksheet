import { useState, useEffect, useCallback } from 'react';
import { Box, Stack, CircularProgress, Tabs, Tab, Alert, Snackbar } from '@mui/material';
import axios from 'axios';
import Layout from './components/Layout';
import DateSelector from './components/DateSelector';
import EtfTabs from './components/EtfTabs';
import HoldingsTable from './components/HoldingsTable';
import ManualScrapeButton from './components/ManualScrapeButton';
import WeeklyHoldingsView from './components/WeeklyHoldingsView';

export default function App() {
  const [viewTab, setViewTab] = useState(0);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [etfNames, setEtfNames] = useState([]);
  const [selectedEtf, setSelectedEtf] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getErrorMessage = (err, context) => {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return `${context} 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.`;
    }
    if (!err.response) {
      return '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.';
    }
    if (err.response.status >= 500) {
      return `서버 오류가 발생했습니다(${err.response.status}). 잠시 후 다시 시도해 주세요.`;
    }
    return `${context} 실패: ${err.response.data?.message || err.message}`;
  };

  const fetchDates = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get('/api/etf/dates');
      setDates(res.data);
      if (res.data.length > 0) {
        setSelectedDate(res.data[0]);
      } else {
        setSelectedDate(null);
        setEtfNames([]);
        setSelectedEtf(null);
        setHoldings([]);
      }
    } catch (err) {
      console.error('Failed to fetch dates:', err);
      setError(getErrorMessage(err, '날짜 목록 조회'));
    }
  }, []);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  useEffect(() => {
    if (!selectedDate) return;
    (async () => {
      try {
        const res = await axios.get(`/api/etf/dates/${selectedDate}/etfs`);
        setEtfNames(res.data);
        if (res.data.length > 0) {
          setSelectedEtf(res.data[0]);
        } else {
          setSelectedEtf(null);
          setHoldings([]);
        }
      } catch (err) {
        console.error('Failed to fetch ETF names:', err);
        setError(getErrorMessage(err, 'ETF 목록 조회'));
        setEtfNames([]);
        setSelectedEtf(null);
        setHoldings([]);
      }
    })();
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate || !selectedEtf) return;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/etf/dates/${selectedDate}/holdings`, {
          params: { etfName: selectedEtf },
        });
        setHoldings(res.data);
      } catch (err) {
        console.error('Failed to fetch holdings:', err);
        setError(getErrorMessage(err, '구성종목 조회'));
        setHoldings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedDate, selectedEtf]);

  return (
    <Layout>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={viewTab}
          onChange={(_, v) => setViewTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="구성종목 조회" sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }} />
          <Tab label="오늘-전일간 비중변화" sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }} />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {viewTab === 0 ? (
        <>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}
          >
            <DateSelector dates={dates} selectedDate={selectedDate} onDateChange={setSelectedDate} />
            <ManualScrapeButton onScrapeComplete={fetchDates} />
          </Stack>

          <EtfTabs etfNames={etfNames} selectedEtf={selectedEtf} onEtfChange={setSelectedEtf} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <HoldingsTable holdings={holdings} />
          )}
        </>
      ) : (
        <WeeklyHoldingsView />
      )}
    </Layout>
  );
}
