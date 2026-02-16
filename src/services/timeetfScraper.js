import dayjs from 'dayjs';
import axios from 'axios';

export const ETF_LIST = [
  { idx: 12, cate: '002', name: 'TIME Korea플러스배당액티브' },
  { idx: 16, cate: '002', name: 'TIME K신재생에너지액티브' },
  { idx: 17, cate: '002', name: 'TIME K이노베이션액티브' },
  { idx: 15, cate: '002', name: 'TIME 코리아밸류업액티브' },
  { idx: 11, cate: '002', name: 'TIME 코스피액티브' },
];

/** 이전 영업일 계산 (주말 건너뛰기) */
export function getPrevBusinessDay(dateStr) {
  let d = dayjs(dateStr).subtract(1, 'day');
  while (d.day() === 0 || d.day() === 6) {
    d = d.subtract(1, 'day');
  }
  return d.format('YYYY-MM-DD');
}

/** HTML 문자열 → DOMParser로 파싱 */
function parseHtml(htmlString) {
  const parser = new DOMParser();
  return parser.parseFromString(htmlString, 'text/html');
}

/** 전체 구성종목 테이블(.moreList1 tbody) 파싱 → [{stockCode, name, quantity, valuation, weight}] */
function parseAllHoldings(doc) {
  const rows = doc.querySelectorAll('.moreList1 tbody tr');
  const holdings = [];

  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 5) {
      const stockCode = cells[0]?.textContent?.trim();
      const name = cells[1]?.textContent?.trim();
      const quantity = cells[2]?.textContent?.trim();
      const valuation = cells[3]?.textContent?.trim();
      const weight = parseFloat(cells[4]?.textContent?.trim());
      if (name && !isNaN(weight)) {
        holdings.push({ stockCode, name, quantity, valuation, weight: weight.toFixed(2) });
      }
    }
  });

  // 비중 내림차순 정렬
  holdings.sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
  return holdings;
}

/** timeetf.co.kr 페이지 직접 요청 (pdfDate 포함) */
function fetchEtfPage(etf, pdfDate) {
  return axios.get('/timeetf/m11_view.php', {
    params: { idx: etf.idx, cate: etf.cate, pdfDate },
    timeout: 20000,
    responseType: 'text',
  });
}

/** 단일 ETF 스크래핑: 오늘 + 하루전 전체 종목 */
async function scrapeEtf(etf, todayDate, yesterdayDate) {
  // 오늘 + 하루전 페이지 동시 로드 (직접 프록시 경유)
  const [todayRes, yesterdayRes] = await Promise.all([
    fetchEtfPage(etf, todayDate),
    fetchEtfPage(etf, yesterdayDate),
  ]);

  const todayDoc = parseHtml(todayRes.data);
  const yesterdayDoc = parseHtml(yesterdayRes.data);

  const todayHoldings = parseAllHoldings(todayDoc);
  const yesterdayHoldings = parseAllHoldings(yesterdayDoc);

  // 하루전 비중 맵 생성 (종목명 → 비중)
  const yesterdayMap = new Map();
  yesterdayHoldings.forEach((h) => yesterdayMap.set(h.name, h.weight));

  // 오늘 데이터에 증감 계산
  const todayWithChange = todayHoldings.map((stock, i) => {
    const prevWeight = yesterdayMap.get(stock.name);
    let change = '신규';
    if (prevWeight !== undefined) {
      const diff = parseFloat(stock.weight) - parseFloat(prevWeight);
      change = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
    }
    return { ...stock, rank: i + 1, change };
  });

  // 하루전 데이터 (순번 부여)
  const yesterdayData = yesterdayHoldings.map((stock, i) => ({
    ...stock,
    rank: i + 1,
  }));

  return {
    etfName: etf.name,
    today: todayWithChange,
    yesterday: yesterdayData,
  };
}

/** 단일 ETF의 특정 날짜 구성종목 스크래핑 */
export async function scrapeSingleDate(etf, targetDate) {
  const res = await fetchEtfPage(etf, targetDate);
  const doc = parseHtml(res.data);
  return parseAllHoldings(doc);
}

/** 전체 5개 ETF 스크래핑 */
export async function scrapeAll(todayDate, onProgress, customYesterdayDate) {
  const yesterdayDate = customYesterdayDate || getPrevBusinessDay(todayDate);
  const results = [];

  for (let i = 0; i < ETF_LIST.length; i++) {
    const etf = ETF_LIST[i];
    onProgress?.({
      current: i + 1,
      total: ETF_LIST.length,
      etfName: etf.name,
    });

    try {
      const result = await scrapeEtf(etf, todayDate, yesterdayDate);
      results.push(result);
    } catch (err) {
      console.error(`${etf.name} 스크래핑 실패:`, err);
      results.push({
        etfName: etf.name,
        today: [],
        yesterday: [],
        error: err.message,
      });
    }

    // 서버 부하 방지
    if (i < ETF_LIST.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return { todayDate, yesterdayDate, results };
}
