// Chart.js Visualization Management with Professional Minimal Palette

let monthlySavingsChart = null;
let cumulativeWealthChart = null;
let assetAllocationChart = null;

// Clean financial color palette (not too flashy, yet distinguishable)
const CHART_COLORS = {
  pension: { bg: 'rgba(59, 130, 246, 0.85)', border: '#2563eb' },     // Blue
  isa: { bg: 'rgba(16, 185, 129, 0.85)', border: '#059669' },         // Emerald Green
  usStock: { bg: 'rgba(139, 92, 246, 0.85)', border: '#7c3aed' },     // Purple
  globalStock: { bg: 'rgba(245, 158, 11, 0.85)', border: '#d97706' }, // Amber
  cma: { bg: 'rgba(100, 116, 139, 0.85)', border: '#475569' }         // Slate Grey
};

const ChartManager = {
  // 1. 월별 저축액 추이 차트 (Stacked Bar)
  renderMonthlySavingsChart(savingsData) {
    const ctx = document.getElementById('monthlySavingsChart');
    if (!ctx) return;

    // 월 오름차순 정렬
    const sorted = [...savingsData].sort((a, b) => a.month.localeCompare(b.month));
    const labels = sorted.map(d => d.month);

    const datasets = [
      {
        label: '연금저축',
        data: sorted.map(d => d.pension),
        backgroundColor: CHART_COLORS.pension.bg,
        borderRadius: 4
      },
      {
        label: 'ISA',
        data: sorted.map(d => d.isa),
        backgroundColor: CHART_COLORS.isa.bg,
        borderRadius: 4
      },
      {
        label: '해외주식',
        data: sorted.map(d => d.usStock),
        backgroundColor: CHART_COLORS.usStock.bg,
        borderRadius: 4
      },
      {
        label: '국내외주식',
        data: sorted.map(d => d.globalStock),
        backgroundColor: CHART_COLORS.globalStock.bg,
        borderRadius: 4
      },
      {
        label: 'CMA',
        data: sorted.map(d => d.cma),
        backgroundColor: CHART_COLORS.cma.bg,
        borderRadius: 4
      }
    ];

    if (monthlySavingsChart) {
      monthlySavingsChart.data.labels = labels;
      monthlySavingsChart.data.datasets = datasets;
      monthlySavingsChart.update();
      return;
    }

    monthlySavingsChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false }
          },
          y: {
            stacked: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: (val) => (val / 10000).toLocaleString() + '만'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, usePointStyle: true, font: { family: 'Pretendard', size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return ` ${context.dataset.label}: ${context.raw.toLocaleString()}원`;
              }
            }
          }
        }
      }
    });
  },

  // 2. 총 적립액 및 자산 성장 곡선 (Area/Line)
  renderCumulativeGrowthChart(savingsData, currentTotalAsset) {
    const ctx = document.getElementById('cumulativeWealthChart');
    if (!ctx) return;

    const sorted = [...savingsData].sort((a, b) => a.month.localeCompare(b.month));
    const labels = sorted.map(d => d.month);

    let cumulativeSum = 0;
    const cumulativeTotals = sorted.map(d => {
      const monthSum = (d.pension || 0) + (d.isa || 0) + (d.usStock || 0) + (d.globalStock || 0) + (d.cma || 0);
      cumulativeSum += monthSum;
      return cumulativeSum;
    });

    const datasets = [
      {
        label: '누적 저축 원금',
        data: cumulativeTotals,
        borderColor: '#0f172a',
        backgroundColor: 'rgba(15, 23, 42, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.2,
        pointRadius: 4,
        pointBackgroundColor: '#0f172a'
      }
    ];

    if (cumulativeWealthChart) {
      cumulativeWealthChart.data.labels = labels;
      cumulativeWealthChart.data.datasets = datasets;
      cumulativeWealthChart.update();
      return;
    }

    cumulativeWealthChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: (val) => (val / 10000).toLocaleString() + '만'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, usePointStyle: true, font: { family: 'Pretendard', size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.raw.toLocaleString()}원`
            }
          }
        }
      }
    });
  },

  // 3. 자산 배분 비중 (Doughnut)
  renderAssetAllocationChart(accountValues) {
    const ctx = document.getElementById('assetAllocationChart');
    if (!ctx) return;

    const labels = ['연금저축', 'ISA', '해외주식', '국내외주식', 'CMA'];
    const dataValues = [
      accountValues.pension || 0,
      accountValues.isa || 0,
      accountValues.usStock || 0,
      accountValues.globalStock || 0,
      accountValues.cma || 0
    ];

    const colors = [
      CHART_COLORS.pension.bg,
      CHART_COLORS.isa.bg,
      CHART_COLORS.usStock.bg,
      CHART_COLORS.globalStock.bg,
      CHART_COLORS.cma.bg
    ];

    if (assetAllocationChart) {
      assetAllocationChart.data.datasets[0].data = dataValues;
      assetAllocationChart.update();
      return;
    }

    assetAllocationChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: dataValues,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, usePointStyle: true, font: { family: 'Pretendard', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const val = context.raw;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${val.toLocaleString()}원 (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
};
