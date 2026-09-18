// LocalStorage & Initial Seed Data Management

const STORAGE_KEYS = {
  SAVINGS: 'wealth_dashboard_savings',
  ACCOUNT_BALANCES: 'wealth_dashboard_account_balances'
};

const DEFAULT_ACCOUNT_BALANCES = {
  pension: null,
  isa: null,
  usStock: null,
  globalStock: null,
  cma: null
};

const StorageManager = {
  getSavings() {
    const data = localStorage.getItem(STORAGE_KEYS.SAVINGS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveSavings(savings) {
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(savings));
  },

  getAccountBalances() {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNT_BALANCES) || localStorage.getItem('wealth_dashboard_cash_balances');
    if (!data) return { ...DEFAULT_ACCOUNT_BALANCES };
    try {
      return { ...DEFAULT_ACCOUNT_BALANCES, ...JSON.parse(data) };
    } catch {
      return { ...DEFAULT_ACCOUNT_BALANCES };
    }
  },
  saveAccountBalances(balances) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_BALANCES, JSON.stringify(balances));
  },

  // 전체 완전 초기화 (모든 저축액 및 잔고 0으로 초기화)
  clearAllData() {
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_BALANCES, JSON.stringify({
      pension: 0,
      isa: 0,
      usStock: 0,
      globalStock: 0,
      cma: 0
    }));
  }
};
