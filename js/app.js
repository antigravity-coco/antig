// Main Application Controller

const ACCOUNT_NAMES = {
  pension: '연금저축',
  isa: 'ISA',
  usStock: '해외주식',
  globalStock: '국내외주식',
  cma: 'CMA'
};

let savings = [];
let accountBalances = {};
let isInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  savings = StorageManager.getSavings();
  accountBalances = StorageManager.getAccountBalances();

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthInput = document.getElementById('inputMonth');
  if (monthInput) monthInput.value = yearMonth;

  if (!isInitialized) {
    setupEventListeners();
    isInitialized = true;
  }
  
  renderAll();
}

function setupEventListeners() {
  // Modal 1: 월 저축액 모달
  const addSavingsModal = document.getElementById('addSavingsModal');
  document.getElementById('openAddSavingsBtn')?.addEventListener('click', () => {
    document.getElementById('savingsForm').reset();
    document.getElementById('savingsEditId').value = '';
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthInput = document.getElementById('inputMonth');
    if (monthInput) monthInput.value = yearMonth;
    document.getElementById('savingsModalTitle').textContent = '월별 저축액 입력';
    addSavingsModal?.classList.remove('hidden');
  });
  document.getElementById('closeSavingsModalBtn')?.addEventListener('click', () => {
    addSavingsModal?.classList.add('hidden');
  });

  // Modal 2: 계좌별 잔고 일괄 수정 모달
  const batchBalancesModal = document.getElementById('batchBalancesModal');
  document.getElementById('openBatchBalancesModalBtn')?.addEventListener('click', () => {
    openBatchBalancesModal();
  });
  document.getElementById('closeBatchBalancesModalBtn')?.addEventListener('click', () => {
    batchBalancesModal?.classList.add('hidden');
  });

  // 월 저축액 Form Submit
  document.getElementById('savingsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('savingsEditId').value;
    const month = document.getElementById('inputMonth').value;
    if (!month) return alert('연월을 선택해주세요.');

    const newRecord = {
      id: editId || ('sav_' + Date.now()),
      month: month,
      pension: parseInt(document.getElementById('inputPension').value) || 0,
      isa: parseInt(document.getElementById('inputIsa').value) || 0,
      usStock: parseInt(document.getElementById('inputUsStock').value) || 0,
      globalStock: parseInt(document.getElementById('inputGlobalStock').value) || 0,
      cma: parseInt(document.getElementById('inputCma').value) || 0
    };

    if (editId) {
      const idx = savings.findIndex(s => s.id === editId);
      if (idx >= 0) savings[idx] = newRecord;
    } else {
      const existingIdx = savings.findIndex(s => s.month === month);
      if (existingIdx >= 0) {
        if (confirm(`${month}월 데이터가 이미 존재합니다. 덮어쓰시겠습니까?`)) {
          savings[existingIdx] = newRecord;
        } else {
          return;
        }
      } else {
        savings.push(newRecord);
      }
    }

    StorageManager.saveSavings(savings);
    addSavingsModal?.classList.add('hidden');
    renderAll();
  });

  // 계좌 잔고 일괄 수정 Form Submit
  document.getElementById('batchBalancesForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    accountBalances = {
      pension: parseInt(document.getElementById('batchPension').value) || 0,
      isa: parseInt(document.getElementById('batchIsa').value) || 0,
      usStock: parseInt(document.getElementById('batchUsStock').value) || 0,
      globalStock: parseInt(document.getElementById('batchGlobalStock').value) || 0,
      cma: parseInt(document.getElementById('batchCma').value) || 0
    };

    StorageManager.saveAccountBalances(accountBalances);
    batchBalancesModal?.classList.add('hidden');
    renderAll();
    alert('계좌별 현재 잔고가 성공적으로 업데이트되었습니다.');
  });

  // Excel template download
  document.getElementById('downloadSavingsTemplateBtn')?.addEventListener('click', () => {
    ExcelManager.downloadSavingsTemplate();
  });

  // Excel upload
  const savingsFileInput = document.getElementById('savingsFileInput');
  document.getElementById('uploadSavingsBtn')?.addEventListener('click', () => savingsFileInput?.click());
  savingsFileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const records = await ExcelManager.parseSavingsFile(file);
      if (records.length === 0) return alert('유효한 저축 데이터가 없습니다.');
      
      records.forEach(newRec => {
        const idx = savings.findIndex(s => s.month === newRec.month);
        if (idx >= 0) savings[idx] = newRec;
        else savings.push(newRec);
      });
      StorageManager.saveSavings(savings);
      renderAll();
      alert(`성공적으로 ${records.length}개의 월별 저축 데이터를 불러왔습니다.`);
    } catch (err) {
      console.error(err);
      alert('엑셀 파일을 읽는 중 오류가 발생했습니다. 양식을 확인해주세요.');
    } finally {
      savingsFileInput.value = '';
    }
  });

  // 전체 데이터 초기화
  document.getElementById('resetDataBtn')?.addEventListener('click', () => {
    if (confirm('모든 저축 내역과 계좌 잔고를 삭제하고 깨끗한 빈 상태(0원)로 초기화하시겠습니까?')) {
      StorageManager.clearAllData();
      location.reload();
    }
  });

  // 현재 데이터 엑셀 다운로드 (백업)
  document.getElementById('downloadCurrentDataBtn')?.addEventListener('click', () => {
    const fin = calculateFinancials();
    const accountSummary = {
      pension: {
        current: fin.accountCurrentValues.pension,
        principal: fin.accountSavings.pension,
        profit: fin.accountCurrentValues.pension - fin.accountSavings.pension,
        yieldPct: fin.accountSavings.pension > 0 ? (((fin.accountCurrentValues.pension - fin.accountSavings.pension) / fin.accountSavings.pension) * 100).toFixed(2) : '0.00'
      },
      isa: {
        current: fin.accountCurrentValues.isa,
        principal: fin.accountSavings.isa,
        profit: fin.accountCurrentValues.isa - fin.accountSavings.isa,
        yieldPct: fin.accountSavings.isa > 0 ? (((fin.accountCurrentValues.isa - fin.accountSavings.isa) / fin.accountSavings.isa) * 100).toFixed(2) : '0.00'
      },
      usStock: {
        current: fin.accountCurrentValues.usStock,
        principal: fin.accountSavings.usStock,
        profit: fin.accountCurrentValues.usStock - fin.accountSavings.usStock,
        yieldPct: fin.accountSavings.usStock > 0 ? (((fin.accountCurrentValues.usStock - fin.accountSavings.usStock) / fin.accountSavings.usStock) * 100).toFixed(2) : '0.00'
      },
      globalStock: {
        current: fin.accountCurrentValues.globalStock,
        principal: fin.accountSavings.globalStock,
        profit: fin.accountCurrentValues.globalStock - fin.accountSavings.globalStock,
        yieldPct: fin.accountSavings.globalStock > 0 ? (((fin.accountCurrentValues.globalStock - fin.accountSavings.globalStock) / fin.accountSavings.globalStock) * 100).toFixed(2) : '0.00'
      },
      cma: {
        current: fin.accountCurrentValues.cma,
        principal: fin.accountSavings.cma,
        profit: fin.accountCurrentValues.cma - fin.accountSavings.cma,
        yieldPct: fin.accountSavings.cma > 0 ? (((fin.accountCurrentValues.cma - fin.accountSavings.cma) / fin.accountSavings.cma) * 100).toFixed(2) : '0.00'
      },
      total: {
        current: fin.currentTotalAsset,
        principal: fin.totalSavings,
        profit: fin.totalProfit,
        yieldPct: fin.totalYieldPct.toFixed(2)
      }
    };
    ExcelManager.exportAllDataToExcel(savings, accountSummary);
  });
}

function openBatchBalancesModal() {
  const fin = calculateFinancials();
  
  document.getElementById('batchPension').value = fin.accountCurrentValues.pension;
  document.getElementById('batchIsa').value = fin.accountCurrentValues.isa;
  document.getElementById('batchUsStock').value = fin.accountCurrentValues.usStock;
  document.getElementById('batchGlobalStock').value = fin.accountCurrentValues.globalStock;
  document.getElementById('batchCma').value = fin.accountCurrentValues.cma;

  document.getElementById('labelPrincipalPension').textContent = `누적원금: ${fin.accountSavings.pension.toLocaleString()}원`;
  document.getElementById('labelPrincipalIsa').textContent = `누적원금: ${fin.accountSavings.isa.toLocaleString()}원`;
  document.getElementById('labelPrincipalUsStock').textContent = `누적원금: ${fin.accountSavings.usStock.toLocaleString()}원`;
  document.getElementById('labelPrincipalGlobalStock').textContent = `누적원금: ${fin.accountSavings.globalStock.toLocaleString()}원`;
  document.getElementById('labelPrincipalCma').textContent = `누적원금: ${fin.accountSavings.cma.toLocaleString()}원`;

  document.getElementById('batchBalancesModal')?.classList.remove('hidden');
}

// -------------------------------------------------------------
// Core Calculations
// -------------------------------------------------------------
function calculateFinancials() {
  let totalSavings = 0;
  const accountSavings = { pension: 0, isa: 0, usStock: 0, globalStock: 0, cma: 0 };

  savings.forEach(item => {
    accountSavings.pension += (item.pension || 0);
    accountSavings.isa += (item.isa || 0);
    accountSavings.usStock += (item.usStock || 0);
    accountSavings.globalStock += (item.globalStock || 0);
    accountSavings.cma += (item.cma || 0);
  });
  totalSavings = Object.values(accountSavings).reduce((a, b) => a + b, 0);

  // 계좌별 현재 잔고 (사용자가 직접 입력한 값이 있으면 그 값을 사용하고, null/미입력이면 누적 저축 원금을 기본값으로 사용)
  const getAccountVal = (key) => {
    if (accountBalances[key] !== null && accountBalances[key] !== undefined) {
      return Number(accountBalances[key]);
    }
    return accountSavings[key] || 0;
  };

  const accountCurrentValues = {
    pension: getAccountVal('pension'),
    isa: getAccountVal('isa'),
    usStock: getAccountVal('usStock'),
    globalStock: getAccountVal('globalStock'),
    cma: getAccountVal('cma')
  };

  const currentTotalAsset = Object.values(accountCurrentValues).reduce((a, b) => a + b, 0);
  const totalProfit = currentTotalAsset - totalSavings;
  const totalYieldPct = totalSavings > 0 ? (totalProfit / totalSavings) * 100 : 0;

  const sortedSavings = [...savings].sort((a, b) => b.month.localeCompare(a.month));
  const latestMonthSavings = sortedSavings.length > 0 ? 
    ((sortedSavings[0].pension || 0) + (sortedSavings[0].isa || 0) + (sortedSavings[0].usStock || 0) + (sortedSavings[0].globalStock || 0) + (sortedSavings[0].cma || 0)) : 0;

  return {
    totalSavings,
    accountSavings,
    accountCurrentValues,
    currentTotalAsset,
    totalProfit,
    totalYieldPct,
    latestMonthSavings,
    latestMonthStr: sortedSavings.length > 0 ? sortedSavings[0].month : '-'
  };
}

// -------------------------------------------------------------
// Render UI Components
// -------------------------------------------------------------
function renderAll() {
  const fin = calculateFinancials();

  // Top Metric Cards
  const totalAssetElem = document.getElementById('metricTotalAsset');
  if (totalAssetElem) totalAssetElem.textContent = fin.currentTotalAsset.toLocaleString() + '원';

  const totalSavingsElem = document.getElementById('metricTotalSavings');
  if (totalSavingsElem) totalSavingsElem.textContent = fin.totalSavings.toLocaleString() + '원';
  
  const profitElem = document.getElementById('metricTotalProfit');
  if (profitElem) {
    const isPositive = fin.totalProfit >= 0;
    profitElem.innerHTML = `
      <span class="${isPositive ? 'text-emerald-600' : 'text-rose-600'} font-semibold">
        ${isPositive ? '+' : ''}${fin.totalProfit.toLocaleString()}원
        (${isPositive ? '+' : ''}${fin.totalYieldPct.toFixed(2)}%)
      </span>
    `;
  }

  const latestMonthElem = document.getElementById('metricLatestMonth');
  if (latestMonthElem) latestMonthElem.textContent = fin.latestMonthSavings.toLocaleString() + '원';

  const latestMonthLabel = document.getElementById('metricLatestMonthLabel');
  if (latestMonthLabel) latestMonthLabel.textContent = `${fin.latestMonthStr} 저축액`;

  // Render Account Cards
  renderAccountCards(fin);

  // Render Charts
  ChartManager.renderMonthlySavingsChart(savings);
  ChartManager.renderCumulativeGrowthChart(savings, fin.currentTotalAsset);
  ChartManager.renderAssetAllocationChart(fin.accountCurrentValues);

  // Render Savings Table
  renderSavingsTable();
}

function renderAccountCards(fin) {
  const container = document.getElementById('accountCardsContainer');
  if (!container) return;

  const accounts = [
    { key: 'pension', name: '연금저축', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'isa', name: 'ISA', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { key: 'usStock', name: '해외주식', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
    { key: 'globalStock', name: '국내외주식', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'cma', name: 'CMA', badge: 'bg-slate-100 text-slate-700 border-slate-200' }
  ];

  container.innerHTML = accounts.map(acc => {
    const val = fin.accountCurrentValues[acc.key] || 0;
    const principal = fin.accountSavings[acc.key] || 0;
    const profit = val - principal;
    const yieldPct = principal > 0 ? ((profit / principal) * 100).toFixed(1) : '0.0';
    const isUp = profit >= 0;

    return `
      <div class="fin-card p-4 flex flex-col justify-between border-slate-200 bg-white hover:border-slate-400 transition">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold px-2 py-0.5 rounded border ${acc.badge}">${acc.name}</span>
            <span class="text-xs ${isUp ? 'text-emerald-600' : 'text-rose-600'} font-mono-num font-semibold">
              ${profit === 0 ? '원금일치 (0.0%)' : `${isUp ? '+' : ''}${profit.toLocaleString()}원 (${isUp ? '+' : ''}${yieldPct}%)`}
            </span>
          </div>
          
          <div class="mt-2">
            <label class="text-[11px] font-medium text-slate-400 block mb-1">현재 총 잔고 (직접입력)</label>
            <div class="flex items-center gap-1">
              <input type="number" step="1" value="${val}"
                onchange="updateAccountBalance('${acc.key}', this.value)"
                title="${acc.name}의 주식평가액 + 예수금 합산 실제 잔고를 입력하세요"
                class="w-full text-base font-bold font-mono-num text-slate-900 bg-slate-50 hover:bg-white border border-slate-200 focus:border-slate-800 rounded px-2.5 py-1 outline-none transition">
              <span class="text-xs text-slate-500 font-medium shrink-0">원</span>
            </div>
          </div>
        </div>

        <div class="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
          <span>누적저축원금</span>
          <span class="font-mono-num text-slate-700 font-medium">${principal.toLocaleString()}원</span>
        </div>
      </div>
    `;
  }).join('');
}

function updateAccountBalance(accKey, valStr) {
  const parsed = parseInt(valStr);
  if (isNaN(parsed) || parsed < 0) return;

  accountBalances[accKey] = parsed;
  StorageManager.saveAccountBalances(accountBalances);
  renderAll();
}

let isSavingsExpanded = false;

function toggleSavingsExpand() {
  isSavingsExpanded = !isSavingsExpanded;
  renderSavingsTable();
}

function renderSavingsTable() {
  const tbody = document.getElementById('savingsTableBody');
  const moreContainer = document.getElementById('savingsLoadMoreContainer');
  const toggleBtnText = document.getElementById('toggleSavingsExpandText');
  const toggleBtnIcon = document.getElementById('toggleSavingsExpandIcon');
  if (!tbody) return;

  const sorted = [...savings].sort((a, b) => b.month.localeCompare(a.month));

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400">저축 내역이 없습니다. 직접 입력하거나 엑셀을 업로드해주세요.</td></tr>`;
    moreContainer?.classList.add('hidden');
    return;
  }

  // 6개월 제한 처리 (더보기 상태가 아니면 최근 6개만 노출)
  const displayList = isSavingsExpanded ? sorted : sorted.slice(0, 6);

  if (sorted.length > 6) {
    moreContainer?.classList.remove('hidden');
    if (toggleBtnText) {
      toggleBtnText.textContent = isSavingsExpanded 
        ? `접기 (최근 6개월만 보기)` 
        : `이전 내역 더보기 (${sorted.length - 6}개월 더 있음)`;
    }
    if (toggleBtnIcon) {
      toggleBtnIcon.setAttribute('data-lucide', isSavingsExpanded ? 'chevron-up' : 'chevron-down');
      lucide.createIcons();
    }
  } else {
    moreContainer?.classList.add('hidden');
  }

  tbody.innerHTML = displayList.map(item => {
    const monthTotal = (item.pension || 0) + (item.isa || 0) + (item.usStock || 0) + (item.globalStock || 0) + (item.cma || 0);

    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 text-sm">
        <td class="py-3 px-4 font-semibold text-slate-800 font-mono-num">${item.month}</td>
        <td class="py-3 px-4 text-right font-mono-num text-slate-700">${(item.pension || 0).toLocaleString()}원</td>
        <td class="py-3 px-4 text-right font-mono-num text-slate-700">${(item.isa || 0).toLocaleString()}원</td>
        <td class="py-3 px-4 text-right font-mono-num text-slate-700">${(item.usStock || 0).toLocaleString()}원</td>
        <td class="py-3 px-4 text-right font-mono-num text-slate-700">${(item.globalStock || 0).toLocaleString()}원</td>
        <td class="py-3 px-4 text-right font-mono-num text-slate-700">${(item.cma || 0).toLocaleString()}원</td>
        <td class="py-3 px-4 text-right font-bold text-slate-900 font-mono-num">${monthTotal.toLocaleString()}원</td>
        <td class="py-3 px-4 text-center space-x-1">
          <button onclick="openEditSavings('${item.id}')" class="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition">수정</button>
          <button onclick="deleteSavings('${item.id}')" class="text-xs text-rose-500 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 transition">삭제</button>
        </td>
      </tr>
    `;
  }).join('');
}

function deleteSavings(id) {
  if (confirm('해당 월의 저축 내역을 삭제하시겠습니까?')) {
    savings = savings.filter(s => s.id !== id);
    StorageManager.saveSavings(savings);
    renderAll();
  }
}

function openEditSavings(id) {
  const item = savings.find(s => s.id === id);
  if (!item) return;

  document.getElementById('savingsEditId').value = item.id;
  document.getElementById('savingsModalTitle').textContent = `${item.month} 저축액 수정`;
  document.getElementById('inputMonth').value = item.month;
  document.getElementById('inputPension').value = item.pension || 0;
  document.getElementById('inputIsa').value = item.isa || 0;
  document.getElementById('inputUsStock').value = item.usStock || 0;
  document.getElementById('inputGlobalStock').value = item.globalStock || 0;
  document.getElementById('inputCma').value = item.cma || 0;

  document.getElementById('addSavingsModal')?.classList.remove('hidden');
}

// Global scope bindings
window.deleteSavings = deleteSavings;
window.openEditSavings = openEditSavings;
window.updateAccountBalance = updateAccountBalance;
window.openBatchBalancesModal = openBatchBalancesModal;
window.toggleSavingsExpand = toggleSavingsExpand;
