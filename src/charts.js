/**
 * BiasMapper - Chart rendering wrappers for Chart.js.
 */

const instances = {};

function destroyChart(id) {
  if (instances[id]) {
    instances[id].destroy();
    delete instances[id];
  }
}

function token(varName, fallback = '') {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim() || fallback;
}

function getThemeTokens() {
  return {
    primary: token('--semantic-color-primary', '#6366f1'),
    textMain: token('--semantic-color-text-primary', '#1e1e2e'),
    textMuted: token('--semantic-color-text-secondary', '#64748b'),
    border: token('--semantic-color-border-subtle', '#e2e8f0'),
    bgSurface: token('--semantic-color-bg-secondary', '#f8fafc'),
    fontBody: token('--semantic-font-family-body', 'system-ui, sans-serif'),
  };
}

export function renderChartTerms(canvasId, terms, copy = {}) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas || !terms.length) return;

  const theme = getThemeTokens();
  const labels = terms.map((item) => item.term);
  const data = terms.map((item) => item.count);
  const maxValue = Math.max(...data);

  instances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: copy.datasetLabel || 'Frecuencia',
        data,
        backgroundColor: data.map((value) => {
          const alpha = Math.round((0.35 + (value / maxValue) * 0.55) * 100);
          return `color-mix(in srgb, ${theme.primary} ${alpha}%, transparent)`;
        }),
        borderColor: theme.primary,
        borderWidth: 1,
        borderRadius: 3,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      animations: { x: { from: 0 } },
      datasets: { bar: { barPercentage: 0.85 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.bgSurface,
          titleColor: theme.textMain,
          bodyColor: theme.textMuted,
          borderColor: theme.border,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.x} ${copy.mentionsLabel || 'apariciones'}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: theme.border },
          ticks: { color: theme.textMuted, font: { family: theme.fontBody, size: 10 } },
        },
        y: {
          grid: { display: false },
          ticks: { color: theme.textMain, font: { family: theme.fontBody, size: 11 } },
        },
      },
    },
  });
}

export function renderChartProfile(canvasId, profile) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const theme = getThemeTokens();

  instances[canvasId] = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: profile.labels,
      datasets: [{
        label: profile.datasetLabel || 'Perfil',
        data: profile.values,
        backgroundColor: `color-mix(in srgb, ${theme.primary} 18%, transparent)`,
        borderColor: theme.primary,
        borderWidth: 2,
        pointBackgroundColor: theme.primary,
        pointRadius: 4,
        pointHoverRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 700,
        easing: 'easeInOutQuart',
        animateRotate: true,
        animateScale: true,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.bgSurface,
          titleColor: theme.textMain,
          bodyColor: theme.textMuted,
          borderColor: theme.border,
          borderWidth: 1,
        },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false, stepSize: 25 },
          grid: { color: theme.border },
          angleLines: { color: theme.border },
          pointLabels: {
            color: theme.textMuted,
            font: { family: theme.fontBody, size: 10 },
          },
        },
      },
    },
  });
}

export function renderChartCadence(canvasId, scores, copy = {}) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas || !scores.length) return;

  const theme = getThemeTokens();
  const intensities = scores.map((score) => Math.min(100, Math.round(Math.abs(score))));
  const average = intensities.reduce((sum, value) => sum + value, 0) / intensities.length;

  instances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: intensities.map((_, index) => `P${index + 1}`),
      datasets: [
        {
          type: 'line',
          label: copy.average || 'Media',
          data: Array(intensities.length).fill(Number(average.toFixed(1))),
          borderColor: 'rgba(148,163,184,0.9)',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          tension: 0,
        },
        {
          label: copy.sentiment || 'Cadencia',
          data: intensities,
          backgroundColor: intensities.map((value) => {
            const alpha = Math.round((0.22 + (value / 100) * 0.5) * 100);
            return `color-mix(in srgb, ${theme.primary} ${alpha}%, transparent)`;
          }),
          borderColor: theme.primary,
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 650, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.bgSurface,
          titleColor: theme.textMain,
          bodyColor: theme.textMuted,
          borderColor: theme.border,
          borderWidth: 1,
          filter: (item) => item.datasetIndex === 1,
          callbacks: {
            title: (ctx) => `${copy.paragraph || 'Párrafo'} ${ctx[0].dataIndex + 1}`,
            label: (ctx) => {
              const value = ctx.parsed.y;
              const band = value >= 60
                ? (copy.charged || 'alta')
                : value >= 30
                  ? (copy.neutral || 'media')
                  : (copy.positive || 'baja');
              return ` ${value}/100 · ${band}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: theme.textMuted,
            font: { family: theme.fontBody, size: 9 },
            maxRotation: 0,
          },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: theme.border },
          ticks: {
            color: theme.textMuted,
            stepSize: 25,
            font: { family: theme.fontBody, size: 9 },
          },
        },
      },
    },
  });
}

export function renderChartArgumentBalance(canvasId, chartData, copy = {}) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas || !chartData?.labels?.length || !chartData?.values?.length) return;

  const theme = getThemeTokens();
  const colors = ['#38bdf8', '#8b5cf6', '#fb7185'];

  instances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: copy.datasetLabel || 'Balance',
        data: chartData.values,
        backgroundColor: colors.map((color) => `color-mix(in srgb, ${color} 72%, transparent)`),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.bgSurface,
          titleColor: theme.textMain,
          bodyColor: theme.textMuted,
          borderColor: theme.border,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textMain, font: { family: theme.fontBody, size: 10 } },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: theme.border },
          ticks: { color: theme.textMuted, stepSize: 25, font: { family: theme.fontBody, size: 9 } },
        },
      },
    },
  });
}

export function renderChartEntities(canvasId, chartData, copy = {}) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas || !chartData?.labels?.length || !chartData?.values?.length) return;

  const theme = getThemeTokens();
  const maxValue = Math.max(...chartData.values, 1);

  instances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: copy.datasetLabel || 'Actores',
        data: chartData.values,
        backgroundColor: chartData.values.map((value) => {
          const alpha = Math.round((0.3 + (value / maxValue) * 0.55) * 100);
          return `color-mix(in srgb, ${theme.primary} ${alpha}%, transparent)`;
        }),
        borderColor: theme.primary,
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.bgSurface,
          titleColor: theme.textMain,
          bodyColor: theme.textMuted,
          borderColor: theme.border,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.x} ${copy.mentionsLabel || 'mentions'}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: theme.border },
          ticks: { color: theme.textMuted, precision: 0, font: { family: theme.fontBody, size: 9 } },
        },
        y: {
          grid: { display: false },
          ticks: { color: theme.textMain, font: { family: theme.fontBody, size: 10 } },
        },
      },
    },
  });
}

export function renderChartSourceAnatomy(canvasId, chartData, copy = {}) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas || !chartData?.labels?.length || !chartData?.values?.length || chartData.isEmpty) return;

  const theme = getThemeTokens();
  const colors = ['#38bdf8', '#8b5cf6', '#f59e0b', '#64748b', '#fb7185'];

  instances[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: chartData.labels,
      datasets: [{
        data: chartData.values,
        backgroundColor: colors.map((color) => `color-mix(in srgb, ${color} 78%, transparent)`),
        borderColor: theme.bgSurface,
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      animation: { duration: 650, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: theme.textMuted,
            boxWidth: 10,
            boxHeight: 10,
            font: { family: theme.fontBody, size: 10 },
          },
        },
        tooltip: {
          backgroundColor: theme.bgSurface,
          titleColor: theme.textMain,
          bodyColor: theme.textMuted,
          borderColor: theme.border,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => {
              const total = chartData.total || 1;
              const value = ctx.parsed;
              const pct = Math.round((value / total) * 100);
              return ` ${ctx.label}: ${value} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

export function renderChartParagraphFlow(canvasId, chartData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas || !chartData?.labels?.length || chartData.isEmpty) return;

  const theme = getThemeTokens();

  instances[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: chartData.focusLabel || 'Focus',
          data: chartData.focusValues,
          borderColor: '#8b5cf6',
          backgroundColor: 'color-mix(in srgb, #8b5cf6 18%, transparent)',
          pointBackgroundColor: '#8b5cf6',
          pointRadius: 3,
          tension: 0.3,
        },
        {
          label: chartData.attributionLabel || 'Attribution',
          data: chartData.attributionValues,
          borderColor: '#38bdf8',
          backgroundColor: 'color-mix(in srgb, #38bdf8 18%, transparent)',
          pointBackgroundColor: '#38bdf8',
          pointRadius: 3,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 650, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: theme.textMuted,
            boxWidth: 10,
            boxHeight: 10,
            font: { family: theme.fontBody, size: 10 },
          },
        },
        tooltip: {
          backgroundColor: theme.bgSurface,
          titleColor: theme.textMain,
          bodyColor: theme.textMuted,
          borderColor: theme.border,
          borderWidth: 1,
          callbacks: {
            afterTitle: (ctx) => {
              const index = ctx?.[0]?.dataIndex ?? -1;
              const term = chartData.focusTerms?.[index];
              return term ? `Foco: ${term}` : '';
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textMuted, font: { family: theme.fontBody, size: 9 } },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: theme.border },
          ticks: { color: theme.textMuted, stepSize: 25, font: { family: theme.fontBody, size: 9 } },
        },
      },
    },
  });
}

export function renderChartActorAttribution(canvasId, chartData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas || !chartData?.labels?.length || chartData.isEmpty) return;

  const theme = getThemeTokens();

  instances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: chartData.attributedLabel || 'Attributed',
          data: chartData.attributed,
          backgroundColor: 'color-mix(in srgb, #38bdf8 72%, transparent)',
          borderColor: '#38bdf8',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: chartData.unattributedLabel || 'Unattributed',
          data: chartData.unattributed,
          backgroundColor: 'color-mix(in srgb, #fb7185 72%, transparent)',
          borderColor: '#fb7185',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 650, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: theme.textMuted,
            boxWidth: 10,
            boxHeight: 10,
            font: { family: theme.fontBody, size: 10 },
          },
        },
        tooltip: {
          backgroundColor: theme.bgSurface,
          titleColor: theme.textMain,
          bodyColor: theme.textMuted,
          borderColor: theme.border,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: theme.border },
          ticks: { color: theme.textMuted, precision: 0, font: { family: theme.fontBody, size: 9 } },
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: { color: theme.textMain, font: { family: theme.fontBody, size: 10 } },
        },
      },
    },
  });
}

export function renderChartRhetoricalFlow(canvasId, chartData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas || !chartData?.labels?.length || chartData.isEmpty) return;

  const theme = getThemeTokens();

  instances[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: chartData.modalLabel || 'Modalization',
          data: chartData.modalValues,
          borderColor: '#f59e0b',
          backgroundColor: 'color-mix(in srgb, #f59e0b 18%, transparent)',
          pointBackgroundColor: '#f59e0b',
          pointRadius: 3,
          tension: 0.28,
        },
        {
          label: chartData.cohesionLabel || 'Cohesion',
          data: chartData.cohesionValues,
          borderColor: '#22c55e',
          backgroundColor: 'color-mix(in srgb, #22c55e 18%, transparent)',
          pointBackgroundColor: '#22c55e',
          pointRadius: 3,
          tension: 0.28,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 650, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: theme.textMuted,
            boxWidth: 10,
            boxHeight: 10,
            font: { family: theme.fontBody, size: 10 },
          },
        },
        tooltip: {
          backgroundColor: theme.bgSurface,
          titleColor: theme.textMain,
          bodyColor: theme.textMuted,
          borderColor: theme.border,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textMuted, font: { family: theme.fontBody, size: 9 } },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: theme.border },
          ticks: { color: theme.textMuted, stepSize: 25, font: { family: theme.fontBody, size: 9 } },
        },
      },
    },
  });
}

export function renderChartFrameDistribution(canvasId, chartData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas || !chartData?.labels?.length || chartData.isEmpty) return;

  const theme = getThemeTokens();
  const colors = ['#f59e0b', '#ef4444', '#38bdf8', '#22c55e', '#8b5cf6', '#94a3b8'];

  instances[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: chartData.labels,
      datasets: [{
        data: chartData.values,
        backgroundColor: colors.map((color) => `color-mix(in srgb, ${color} 78%, transparent)`),
        borderColor: theme.bgSurface,
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '58%',
      animation: { duration: 650, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: theme.textMuted,
            boxWidth: 10,
            boxHeight: 10,
            font: { family: theme.fontBody, size: 10 },
          },
        },
        tooltip: {
          backgroundColor: theme.bgSurface,
          titleColor: theme.textMain,
          bodyColor: theme.textMuted,
          borderColor: theme.border,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
          },
        },
      },
    },
  });
}

const sentimentZonePlugin = {
  id: 'bm-sentiment-zones',
  beforeDraw(chart) {
    const { ctx, chartArea, scales: { y } } = chart;
    if (!chartArea || !y) return;
    const { left, right } = chartArea;
    const y30pos = y.getPixelForValue(30);
    const y100pos = y.getPixelForValue(100);
    const y30neg = y.getPixelForValue(-30);
    const y100neg = y.getPixelForValue(-100);
    ctx.save();
    ctx.fillStyle = 'rgba(34,197,94,0.09)';
    ctx.fillRect(left, y100pos, right - left, y30pos - y100pos);
    ctx.fillStyle = 'rgba(239,68,68,0.09)';
    ctx.fillRect(left, y30neg, right - left, y100neg - y30neg);
    ctx.restore();
  },
};

export function renderChartSentiment(canvasId, scores, average, copy = {}) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas || !scores.length) return;

  const theme = getThemeTokens();
  const ctx = canvas.getContext('2d');
  const height = canvas.parentElement.clientHeight || 160;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(34,197,94,0.28)');
  gradient.addColorStop(0.42, 'rgba(34,197,94,0.04)');
  gradient.addColorStop(0.5, 'rgba(100,116,139,0.02)');
  gradient.addColorStop(0.58, 'rgba(239,68,68,0.04)');
  gradient.addColorStop(1, 'rgba(239,68,68,0.28)');

  const pointColors = scores.map((score) =>
    score > 20 ? '#22c55e' : score < -20 ? '#ef4444' : '#94a3b8'
  );

  instances[canvasId] = new Chart(canvas, {
    type: 'line',
    plugins: [sentimentZonePlugin],
    data: {
      labels: scores.map((_, index) => `P${index + 1}`),
      datasets: [
        {
          label: copy.average || 'Media',
          data: Array(scores.length).fill(average),
          borderColor: average > 20 ? '#22c55e' : average < -20 ? '#ef4444' : '#94a3b8',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
        },
        {
          label: copy.sentiment || 'Sentimiento',
          data: scores,
          borderColor: theme.primary,
          borderWidth: 2,
          backgroundColor: gradient,
          fill: 'origin',
          tension: 0.4,
          pointRadius: scores.length > 20 ? 2 : 4,
          pointHoverRadius: 5,
          pointBackgroundColor: pointColors,
          pointBorderColor: 'transparent',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.bgSurface,
          titleColor: theme.textMain,
          bodyColor: theme.textMuted,
          borderColor: theme.border,
          borderWidth: 1,
          filter: (item) => item.datasetIndex === 1,
          callbacks: {
            title: (ctx) => `${copy.paragraph || 'Parrafo'} ${ctx[0].dataIndex + 1}`,
            label: (ctx) => {
              const value = ctx.parsed.y;
              const tone = value > 20
                ? copy.positive || 'positivo'
                : value < -20
                  ? copy.charged || 'cargado'
                  : copy.neutral || 'neutro';
              return ` ${value > 0 ? '+' : ''}${value} ${tone}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: theme.textMuted,
            font: { family: theme.fontBody, size: 9 },
            maxTicksLimit: 8,
            maxRotation: 0,
          },
        },
        y: {
          min: -100,
          max: 100,
          grid: { color: theme.border },
          ticks: {
            color: theme.textMuted,
            font: { family: theme.fontBody, size: 9 },
            stepSize: 50,
            callback: (value) => value === 0 ? '0' : (value > 0 ? `+${value}` : `${value}`),
          },
        },
      },
    },
  });
}
