import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const urlParams = new URL(req.url).searchParams;
  const providedKey = urlParams.get('key');
  const selectedDate = urlParams.get('date') || 'all'; // 'all', 'today', '7days', '30days' or YYYY-MM-DD
  const action = urlParams.get('action');
  const secretKey = process.env.ADMIN_KEY || 'zenzone2026';

  // Si la clave no coincide, mostrar pantalla de inicio de sesión
  if (providedKey !== secretKey) {
    return new Response(renderLoginForm(providedKey !== null), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  const clickStore = getStore({ name: 'affiliate-click-logs', consistency: 'strong' });
  const pvStore = getStore({ name: 'site-analytics-pv', consistency: 'strong' });

  // Acción: Resetear estadísticas
  if (action === 'reset') {
    await clickStore.setJSON('clicks_data', []);
    const daysIndex = await pvStore.get('days_index', { type: 'json' }) || [];
    for (const dayKey of daysIndex) {
      await pvStore.setJSON(`stats_${dayKey}`, { date: dayKey, totalViews: 0, uniqueVisitors: [], pages: {}, lang: { es: 0, en: 0 } });
    }
    return new Response(null, {
      status: 302,
      headers: { Location: `/admin/clics?key=${secretKey}` }
    });
  }

  // Obtener Clics de Afiliados
  const allClicks = await clickStore.get('clicks_data', { type: 'json' }) || [];

  // Obtener Índice de Días Registrados de Pageviews
  const daysIndex = await pvStore.get('days_index', { type: 'json' }) || [];

  // Obtener datos diarios de Pageviews de todos los días conocidos
  const dailyPvMap = {};
  for (const dayKey of daysIndex) {
    const dayData = await pvStore.get(`stats_${dayKey}`, { type: 'json' });
    if (dayData) {
      dailyPvMap[dayKey] = dayData;
    }
  }

  // Si no hay días indexados pero hoy existe, incluir hoy
  const todayKey = new Date().toISOString().split('T')[0];
  if (!dailyPvMap[todayKey]) {
    const todayData = await pvStore.get(`stats_${todayKey}`, { type: 'json' });
    if (todayData) dailyPvMap[todayKey] = todayData;
  }

  // Calcular fechas a filtrar
  const availableDates = Array.from(new Set([...daysIndex, ...allClicks.map(c => c.dateKey || c.timestamp?.split('T')[0]).filter(Boolean)])).sort().reverse();

  // Filtrar Clics según fecha seleccionada
  let filteredClicks = allClicks;
  let filteredPvMap = dailyPvMap;

  if (selectedDate === 'today') {
    filteredClicks = allClicks.filter(c => (c.dateKey || c.timestamp?.split('T')[0]) === todayKey);
    filteredPvMap = todayKey in dailyPvMap ? { [todayKey]: dailyPvMap[todayKey] } : {};
  } else if (selectedDate === '7days') {
    const last7 = availableDates.slice(0, 7);
    filteredClicks = allClicks.filter(c => last7.includes(c.dateKey || c.timestamp?.split('T')[0]));
    filteredPvMap = Object.fromEntries(Object.entries(dailyPvMap).filter(([k]) => last7.includes(k)));
  } else if (selectedDate === '30days') {
    const last30 = availableDates.slice(0, 30);
    filteredClicks = allClicks.filter(c => last30.includes(c.dateKey || c.timestamp?.split('T')[0]));
    filteredPvMap = Object.fromEntries(Object.entries(dailyPvMap).filter(([k]) => last30.includes(k)));
  } else if (selectedDate !== 'all' && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    filteredClicks = allClicks.filter(c => (c.dateKey || c.timestamp?.split('T')[0]) === selectedDate);
    filteredPvMap = selectedDate in dailyPvMap ? { [selectedDate]: dailyPvMap[selectedDate] } : {};
  }

  // Calcular totales para la vista seleccionada
  const totalClicks = filteredClicks.length;

  let totalPageviews = 0;
  const globalUniqueVisitorSet = new Set();
  const pageViewsCount = {};

  Object.values(filteredPvMap).forEach(d => {
    totalPageviews += d.totalViews || 0;
    (d.uniqueVisitors || []).forEach(v => globalUniqueVisitorSet.add(v));
    Object.entries(d.pages || {}).forEach(([p, count]) => {
      pageViewsCount[p] = (pageViewsCount[p] || 0) + count;
    });
  });

  const totalUniqueVisitors = globalUniqueVisitorSet.size;
  const ctrRate = totalUniqueVisitors > 0 ? ((totalClicks / totalUniqueVisitors) * 100).toFixed(1) : '0.0';

  // Productos más clicados
  const productCounts = {};
  // Páginas con más clics
  const clickPageCounts = {};
  const langCounts = { es: 0, en: 0 };

  filteredClicks.forEach(c => {
    productCounts[c.name] = (productCounts[c.name] || 0) + 1;
    clickPageCounts[c.page] = (clickPageCounts[c.page] || 0) + 1;
    if (c.lang === 'en') langCounts.en++;
    else langCounts.es++;
  });

  const sortedProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]);
  const sortedClickPages = Object.entries(clickPageCounts).sort((a, b) => b[1] - a[1]);
  const sortedPvPages = Object.entries(pageViewsCount).sort((a, b) => b[1] - a[1]);

  // Datos para el Gráfico de Evolución Diaria (Últimos 14 días disponibles)
  const chartDates = availableDates.slice(0, 14).reverse();
  const chartUniqueVisitors = chartDates.map(d => dailyPvMap[d]?.uniqueVisitors?.length || 0);
  const chartPageviews = chartDates.map(d => dailyPvMap[d]?.totalViews || 0);
  const chartClicks = chartDates.map(d => allClicks.filter(c => (c.dateKey || c.timestamp?.split('T')[0]) === d).length);

  const html = renderDashboard({
    secretKey,
    selectedDate,
    availableDates,
    totalClicks,
    totalUniqueVisitors,
    totalPageviews,
    ctrRate,
    filteredClicks,
    sortedProducts,
    sortedClickPages,
    sortedPvPages,
    langCounts,
    chartDates,
    chartUniqueVisitors,
    chartPageviews,
    chartClicks
  });

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};

function renderLoginForm(isError) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso Privado | ZenZone Analytics</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
    <div class="text-center mb-6">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl mx-auto mb-3">
        🔒
      </div>
      <h1 class="text-2xl font-black text-white">Panel de Analíticas Privado</h1>
      <p class="text-xs text-slate-400 mt-1">Introduce tu clave de administración para acceder</p>
    </div>

    ${isError ? `
      <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl mb-4 text-center font-bold">
        ⚠️ Clave incorrecta. Revisa e inténtalo de nuevo.
      </div>
    ` : ''}

    <form method="GET" action="/admin/clics" class="space-y-4">
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Clave Secreta</label>
        <input 
          type="password" 
          name="key" 
          placeholder="••••••••••••" 
          required 
          class="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
        />
      </div>

      <button 
        type="submit" 
        class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/10"
      >
        Acceder al Panel ➔
      </button>
    </form>
  </div>
</body>
</html>`;
}

function renderDashboard({
  secretKey, selectedDate, availableDates, totalClicks, totalUniqueVisitors, totalPageviews, ctrRate,
  filteredClicks, sortedProducts, sortedClickPages, sortedPvPages, langCounts,
  chartDates, chartUniqueVisitors, chartPageviews, chartClicks
}) {
  const formatDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('es-ES', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      });
    } catch { return isoStr; }
  };

  const getDeviceIcon = (ua) => {
    if (/mobile|android|iphone/i.test(ua)) return '📱';
    if (/tablet|ipad/i.test(ua)) return 'タブ';
    return '💻';
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel de Analíticas y Clics | ZenZone</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-slate-950 text-slate-200 min-h-screen pb-16 font-sans">

  <!-- Header & Filtro de Fecha -->
  <header class="bg-slate-900 border-b border-slate-800 py-6 mb-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shadow-amber-500/10">
          ZZ
        </div>
        <div>
          <h1 class="text-xl font-black text-white">Hub de Analíticas & Clics en Afiliados</h1>
          <p class="text-xs text-slate-400">Rastreo directo en servidor (Inmune a AdBlockers)</p>
        </div>
      </div>

      <!-- Selector de Período y Fecha -->
      <div class="flex flex-wrap items-center gap-2">
        <form method="GET" action="/admin/clics" class="flex items-center gap-2">
          <input type="hidden" name="key" value="${secretKey}" />
          <select 
            name="date" 
            onchange="this.form.submit()" 
            class="bg-slate-950 border border-slate-800 text-xs font-bold text-amber-400 rounded-xl px-3 py-2 outline-none focus:border-amber-400"
          >
            <option value="all" ${selectedDate === 'all' ? 'selected' : ''}>🌐 Acumulado Total General</option>
            <option value="today" ${selectedDate === 'today' ? 'selected' : ''}>📅 Hoy (${new Date().toISOString().split('T')[0]})</option>
            <option value="7days" ${selectedDate === '7days' ? 'selected' : ''}>📊 Últimos 7 días</option>
            <option value="30days" ${selectedDate === '30days' ? 'selected' : ''}>📆 Últimos 30 días</option>
            ${availableDates.map(d => `<option value="${d}" ${selectedDate === d ? 'selected' : ''}>📆 Día: ${d}</option>`).join('')}
          </select>
        </form>

        <a 
          href="/admin/clics?key=${secretKey}&date=${selectedDate}" 
          class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs transition-all"
        >
          🔄 Refrescar
        </a>
        <a 
          href="/admin/clics?key=${secretKey}&action=reset" 
          onclick="return confirm('¿Seguro que deseas reiniciar el historial de estadísticas?');" 
          class="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold px-3 py-2 rounded-xl text-xs transition-all"
        >
          🗑️ Reset
        </a>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

    <!-- Tarjetas KPI -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <span class="text-xs font-extrabold uppercase tracking-wider text-purple-400">Usuarios Únicos Reales</span>
        <div class="text-4xl font-black text-white mt-2 mb-1">${totalUniqueVisitors}</div>
        <p class="text-xs text-slate-400">Visitantes sin bots en el periodo seleccionado</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <span class="text-xs font-extrabold uppercase tracking-wider text-blue-400">Vistas de Página (PV)</span>
        <div class="text-4xl font-black text-white mt-2 mb-1">${totalPageviews}</div>
        <p class="text-xs text-slate-400">Páginas servidas a usuarios reales</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <span class="text-xs font-extrabold uppercase tracking-wider text-amber-400">Clics en Amazon</span>
        <div class="text-4xl font-black text-white mt-2 mb-1">${totalClicks}</div>
        <p class="text-xs text-slate-400">Redirecciones a Amazon con tu ID de afiliado</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Tasa de Clic (CTR)</span>
        <div class="text-4xl font-black text-white mt-2 mb-1">${ctrRate}%</div>
        <p class="text-xs text-slate-400">Porcentaje de visitantes que hicieron clic en Amazon</p>
      </div>

    </div>

    <!-- Gráfico Interactivo de Evolución Diaria -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 class="text-xl font-black text-white">📈 Gráfico de Evolución Diaria</h3>
          <p class="text-xs text-slate-400">Comparativa diaria de Usuarios Únicos vs. Clics en Amazon</p>
        </div>
        <div class="flex items-center gap-4 text-xs font-bold">
          <span class="flex items-center gap-1.5 text-purple-400"><span class="w-3 h-3 rounded-full bg-purple-500"></span> Usuarios Únicos</span>
          <span class="flex items-center gap-1.5 text-amber-400"><span class="w-3 h-3 rounded-full bg-amber-500"></span> Clics Amazon</span>
        </div>
      </div>

      <div class="h-64 sm:h-72 w-full">
        <canvas id="evolutionChart"></canvas>
      </div>
    </div>

    <!-- Rankings Desglosados -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Productos más clicados -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 class="text-lg font-black text-white mb-4 flex items-center justify-between">
          <span>🏆 Productos Más Clicados</span>
          <span class="text-xs text-amber-400 font-bold">${sortedProducts.length} prod</span>
        </h3>

        ${sortedProducts.length === 0 ? `
          <p class="text-sm text-slate-500 py-8 text-center">Sin clics registrados en este periodo.</p>
        ` : `
          <div class="space-y-4">
            ${sortedProducts.slice(0, 8).map(([pName, pCount], idx) => {
              const pct = totalClicks > 0 ? Math.round((pCount / totalClicks) * 100) : 0;
              return `
                <div>
                  <div class="flex justify-between items-center text-xs font-bold mb-1">
                    <span class="text-slate-200 truncate max-w-[200px]">${idx + 1}. ${pName}</span>
                    <span class="text-amber-400 font-black">${pCount} (${pct}%)</span>
                  </div>
                  <div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div class="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Páginas que generan más Clics -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 class="text-lg font-black text-white mb-4 flex items-center justify-between">
          <span>🎯 Páginas más Convertidoras</span>
          <span class="text-xs text-emerald-400 font-bold">Origen Clic</span>
        </h3>

        ${sortedClickPages.length === 0 ? `
          <p class="text-sm text-slate-500 py-8 text-center">Sin clics originados en este periodo.</p>
        ` : `
          <div class="space-y-4">
            ${sortedClickPages.slice(0, 8).map(([pPath, pCount], idx) => {
              const pct = totalClicks > 0 ? Math.round((pCount / totalClicks) * 100) : 0;
              return `
                <div>
                  <div class="flex justify-between items-center text-xs font-bold mb-1">
                    <span class="text-slate-200 font-mono truncate max-w-[200px]">${pPath}</span>
                    <span class="text-emerald-400 font-black">${pCount} clics</span>
                  </div>
                  <div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div class="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Páginas más visitadas -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 class="text-lg font-black text-white mb-4 flex items-center justify-between">
          <span>👀 Páginas Más Visitadas</span>
          <span class="text-xs text-blue-400 font-bold">Tráfico Real</span>
        </h3>

        ${sortedPvPages.length === 0 ? `
          <p class="text-sm text-slate-500 py-8 text-center">Sin visitas registradas en este periodo.</p>
        ` : `
          <div class="space-y-4">
            ${sortedPvPages.slice(0, 8).map(([pPath, pCount], idx) => {
              const pct = totalPageviews > 0 ? Math.round((pCount / totalPageviews) * 100) : 0;
              return `
                <div>
                  <div class="flex justify-between items-center text-xs font-bold mb-1">
                    <span class="text-slate-200 font-mono truncate max-w-[200px]">${pPath}</span>
                    <span class="text-blue-400 font-black">${pCount} vistas</span>
                  </div>
                  <div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div class="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

    </div>

    <!-- Tabla de Historial en Tiempo Real -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-black text-white">
          📋 Registro de Clics Recientes (${filteredClicks.length})
        </h3>
        <span class="text-xs text-slate-400">Filtrado por: <strong class="text-amber-400 uppercase">${selectedDate}</strong></span>
      </div>

      ${filteredClicks.length === 0 ? `
        <p class="text-sm text-slate-500 py-8 text-center">No hay clics en el periodo seleccionado.</p>
      ` : `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th class="p-3">Fecha / Hora</th>
                <th class="p-3">Producto</th>
                <th class="p-3">Página Origen</th>
                <th class="p-3">Idioma</th>
                <th class="p-3 text-center">Dispositivo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              ${filteredClicks.map(c => `
                <tr class="hover:bg-slate-800/40 transition-colors">
                  <td class="p-3 font-mono text-slate-400 whitespace-nowrap">${formatDate(c.timestamp)}</td>
                  <td class="p-3 font-bold text-white max-w-[260px] truncate" title="${c.name}">${c.name}</td>
                  <td class="p-3 font-mono text-amber-400 whitespace-nowrap">${c.page}</td>
                  <td class="p-3 uppercase font-bold text-slate-300">${c.lang || 'es'}</td>
                  <td class="p-3 text-center text-sm">${getDeviceIcon(c.ua)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

  </main>

  <!-- Script del Gráfico Chart.js -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const ctx = document.getElementById('evolutionChart');
      if (!ctx) return;

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ${JSON.stringify(chartDates.length > 0 ? chartDates : ['Sin datos'])},
          datasets: [
            {
              label: 'Usuarios Únicos',
              data: ${JSON.stringify(chartUniqueVisitors.length > 0 ? chartUniqueVisitors : [0])},
              borderColor: '#c084fc',
              backgroundColor: 'rgba(192, 132, 252, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6
            },
            {
              label: 'Clics en Amazon',
              data: ${JSON.stringify(chartClicks.length > 0 ? chartClicks : [0])},
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              borderWidth: 3,
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 12,
              displayColors: true
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(51, 65, 85, 0.3)' },
              ticks: { color: '#94a3b8', font: { size: 11, weight: 'bold' } }
            },
            y: {
              grid: { color: 'rgba(51, 65, 85, 0.3)' },
              ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 },
              beginAtZero: true
            }
          }
        }
      });
    });
  </script>

</body>
</html>`;
}
