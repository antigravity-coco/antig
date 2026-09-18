// Excel Template Generation and File Parsing using SheetJS (XLSX)

const ExcelManager = {
  // 1. 저축 내역 엑셀 양식 다운로드
  downloadSavingsTemplate() {
    const templateData = [
      {
        '연월(YYYY-MM)': '2026-07',
        '연금저축(원)': 600000,
        'ISA(원)': 600000,
        '해외주식(원)': 1200000,
        '국내외주식(원)': 500000,
        'CMA(원)': 500000,
        '비고': '샘플 입력용 행 (수정 후 업로드)'
      },
      {
        '연월(YYYY-MM)': '2026-08',
        '연금저축(원)': 600000,
        'ISA(원)': 600000,
        '해외주식(원)': 1200000,
        '국내외주식(원)': 500000,
        'CMA(원)': 500000,
        '비고': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    // 컬럼 너비 지정
    worksheet['!cols'] = [
      { wch: 15 }, // 연월
      { wch: 15 }, // 연금저축
      { wch: 15 }, // ISA
      { wch: 15 }, // 해외주식
      { wch: 15 }, // 국내외주식
      { wch: 15 }, // CMA
      { wch: 30 }  // 비고
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '월별저축액양식');
    XLSX.writeFile(workbook, '월별_저축액_입력양식.xlsx');
  },

  // 2. 현재 입력된 전체 데이터(저축 내역 + 계좌별 현재 잔고 요약)를 엑셀 파일 하나로 다운로드
  exportAllDataToExcel(savingsData, accountSummary) {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: 월별 저축 내역
    const sortedSavings = [...savingsData].sort((a, b) => a.month.localeCompare(b.month));
    const savingsRows = sortedSavings.map(s => ({
      '연월': s.month,
      '연금저축(원)': s.pension || 0,
      'ISA(원)': s.isa || 0,
      '해외주식(원)': s.usStock || 0,
      '국내외주식(원)': s.globalStock || 0,
      'CMA(원)': s.cma || 0,
      '월 합계(원)': (s.pension || 0) + (s.isa || 0) + (s.usStock || 0) + (s.globalStock || 0) + (s.cma || 0)
    }));

    const wsSavings = XLSX.utils.json_to_sheet(savingsRows.length > 0 ? savingsRows : [{ '연월': '', '안내': '입력된 저축 내역이 없습니다.' }]);
    wsSavings['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, wsSavings, '월별_저축내역');

    // Sheet 2: 계좌별 현재 잔고 및 평가손익 요약
    const accountRows = [
      {
        '계좌구분': '연금저축',
        '현재 잔고(평가액+예수금)': accountSummary.pension.current,
        '누적 저축 원금': accountSummary.pension.principal,
        '평가손익(원)': accountSummary.pension.profit,
        '수익률(%)': accountSummary.pension.yieldPct + '%'
      },
      {
        '계좌구분': 'ISA',
        '현재 잔고(평가액+예수금)': accountSummary.isa.current,
        '누적 저축 원금': accountSummary.isa.principal,
        '평가손익(원)': accountSummary.isa.profit,
        '수익률(%)': accountSummary.isa.yieldPct + '%'
      },
      {
        '계좌구분': '해외주식',
        '현재 잔고(평가액+예수금)': accountSummary.usStock.current,
        '누적 저축 원금': accountSummary.usStock.principal,
        '평가손익(원)': accountSummary.usStock.profit,
        '수익률(%)': accountSummary.usStock.yieldPct + '%'
      },
      {
        '계좌구분': '국내외주식',
        '현재 잔고(평가액+예수금)': accountSummary.globalStock.current,
        '누적 저축 원금': accountSummary.globalStock.principal,
        '평가손익(원)': accountSummary.globalStock.profit,
        '수익률(%)': accountSummary.globalStock.yieldPct + '%'
      },
      {
        '계좌구분': 'CMA',
        '현재 잔고(평가액+예수금)': accountSummary.cma.current,
        '누적 저축 원금': accountSummary.cma.principal,
        '평가손익(원)': accountSummary.cma.profit,
        '수익률(%)': accountSummary.cma.yieldPct + '%'
      },
      {
        '계좌구분': '총합계',
        '현재 잔고(평가액+예수금)': accountSummary.total.current,
        '누적 저축 원금': accountSummary.total.principal,
        '평가손익(원)': accountSummary.total.profit,
        '수익률(%)': accountSummary.total.yieldPct + '%'
      }
    ];

    const wsSummary = XLSX.utils.json_to_sheet(accountRows);
    wsSummary['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, wsSummary, '계좌별_잔고현황');

    // 파일 저장
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    XLSX.writeFile(workbook, `자산현황_데이터백업_${dateStr}.xlsx`);
  },

  // 3. 저축 내역 엑셀 파일 읽기 및 파싱
  parseSavingsFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet);

          const parsedList = [];
          json.forEach((row, idx) => {
            const rawMonth = row['연월(YYYY-MM)'] || row['연월'] || row['날짜'];
            if (!rawMonth) return;

            let monthStr = String(rawMonth).trim();
            // 숫자 형식 (예: 202601) 대응
            if (/^\d{6}$/.test(monthStr)) {
              monthStr = monthStr.slice(0, 4) + '-' + monthStr.slice(4, 6);
            }

            parsedList.push({
              id: 'imp_' + Date.now() + '_' + idx,
              month: monthStr,
              pension: Number(row['연금저축(원)'] || row['연금저축'] || 0),
              isa: Number(row['ISA(원)'] || row['ISA'] || 0),
              usStock: Number(row['해외주식(원)'] || row['해외주식'] || 0),
              globalStock: Number(row['국내외주식(원)'] || row['국내외주식'] || 0),
              cma: Number(row['CMA(원)'] || row['CMA'] || 0)
            });
          });

          resolve(parsedList);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }
};
