import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography
} from '@mui/material';

function formatNumber(num) {
  if (num == null) return '-';
  return num.toLocaleString();
}

export default function HoldingsTable({ holdings }) {
  if (!holdings || holdings.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        데이터가 없습니다. 스크래핑을 실행해 주세요.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 500 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell align="center" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>순번</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>종목코드</TableCell>
            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>종목명</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>수량</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>평가금액(원)</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>비중(%)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {holdings.map((h) => (
            <TableRow key={h.id} hover>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{h.orderNo === -1 ? '-' : h.orderNo}</TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{h.stockCode || '-'}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.stockName}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatNumber(h.quantity)}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatNumber(h.valuationAmount)}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{h.weight != null ? h.weight.toFixed(2) : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
