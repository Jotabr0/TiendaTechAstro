import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const urlParams = new URL(req.url).searchParams;
  const providedKey = urlParams.get('key');
  const action = urlParams.get('action');
  const secretKey = process.env.ADMIN_KEY || 'zenzone2026';

  // Si la clave no coincide, mostrar pantalla de inicio de sesión
  if (providedKey !== secretKey) {
    return new Response(renderLoginForm(providedKey !== null), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  const store = getStore({
    name: 'affiliate-click-logs',
    consistency: 'strong'
  });

  // Acción: Resetear estadísticas
  if (action === 'reset') {
    await store.setJSON('clicks_data', []);
    return new Response(null, {
      status: 302,
      headers: { Location: `/admin/clics?key=${secretKey}` }
    });
  }

  // Acción: Exportar JSON
  if (action === 'export') {
    const clicks = await store.get('clicks_data', { type: 'json' }) || [];
    return new Response(JSON.stringify(clicks, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="clics-afiliados-zenzone.json"'
      }
    });
  }

  // Obtener historial de clics
  const clicks = await store.get('clicks_data', { type: 'json' }) || [];

  // Procesar métricas
  const totalClicks = clicks.length;
  
  // Conteo por Producto
  const productCounts = {};
  // Conteo por Página de Origen
  const pageCounts = {};
  // Conteo por Idioma
  const langCounts = { es: 0, en: 0 };

  clicks.forEach(c => {
    productCounts[c.name] = (productCounts[c.name] || 0) + 1;
    pageCounts[c.page] = (pageCounts[c.page] || 0) + 1;
    if (c.lang === 'en') langCounts.en++;
    else langCounts.es++;
  });

  const sortedProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1]);

  const sortedPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1]);

  const html = renderDashboard({
    secretKey,
    totalClicks,
    clicks,
    sortedProducts,
    sortedPages,
    langCounts
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
  <title>Acceso Privado | ZenZone Stats</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
    <div class="text-center mb-6">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl mx-auto mb-3">
        🔒
      </div>
      <h1 class="text-2xl font-black text-white">Panel de Clics Privado</h1>
      <p class="text-xs text-slate-400 mt-1">Introduce la clave secreta de administración para continuar</p>
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

function renderDashboard({ secretKey, totalClicks, clicks, sortedProducts, sortedPages, langCounts }) {
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
  <title>Panel de Clics de Afiliados | ZenZone</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-200 min-h-screen pb-16 font-sans">

  <!-- Header -->
  <header class="bg-slate-900 border-b border-slate-800 py-6 mb-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg">
          ZZ
        </div>
        <div>
          <h1 class="text-xl font-black text-white">Informe Privado de Clics en Amazon</h1>
          <p class="text-xs text-slate-400">Tracking directo en servidor (Inmune a AdBlockers)</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <a 
          href="/admin/clics?key=${secretKey}" 
          class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5"
        >
          🔄 Refrescar
        </a>
        <a 
          href="/admin/clics?key=${secretKey}&action=export" 
          class="bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5"
        >
          📥 Exportar JSON
        </a>
        <a 
          href="/admin/clics?key=${secretKey}&action=reset" 
          onclick="return confirm('¿Seguro que deseas borrar el historial de clics?');" 
          class="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold px-4 py-2 rounded-xl text-xs transition-all"
        >
          🗑️ Resetear
        </a>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

    <!-- Tarjetas KPI -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <span class="text-xs font-extrabold uppercase tracking-wider text-amber-400">Total Clics Reales</span>
        <div class="text-4xl font-black text-white mt-2 mb-1">${totalClicks}</div>
        <p class="text-xs text-slate-400">Registrados en servidor desde Amazon CTA</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Productos Distintos</span>
        <div class="text-4xl font-black text-white mt-2 mb-1">${sortedProducts.length}</div>
        <p class="text-xs text-slate-400">Productos del catálogo con al menos 1 clic</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <span class="text-xs font-extrabold uppercase tracking-wider text-cyan-400">Desglose por Idioma</span>
        <div class="flex items-center gap-4 mt-3">
          <div>
            <span class="text-xs text-slate-400 block font-bold">🇪🇸 Español</span>
            <span class="text-xl font-black text-white">${langCounts.es} clics</span>
          </div>
          <div class="h-8 w-px bg-slate-800"></div>
          <div>
            <span class="text-xs text-slate-400 block font-bold">🇬🇧 Inglés</span>
            <span class="text-xl font-black text-white">${langCounts.en} clics</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Ranking de Productos y Páginas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- Productos más clicados -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 class="text-lg font-black text-white mb-4 flex items-center justify-between">
          <span>🏆 Productos Más Clicados</span>
          <span class="text-xs text-slate-400 font-normal">Top Ranking</span>
        </h3>

        ${sortedProducts.length === 0 ? `
          <p class="text-sm text-slate-500 py-8 text-center">Aún no se ha registrado ningún clic. ¡Comparte tus enlaces para ver la actividad aquí!</p>
        ` : `
          <div class="space-y-4">
            ${sortedProducts.map(([pName, pCount], idx) => {
              const pct = totalClicks > 0 ? Math.round((pCount / totalClicks) * 100) : 0;
              return `
                <div>
                  <div class="flex justify-between items-center text-xs font-bold mb-1">
                    <span class="text-slate-200 truncate max-w-[240px] sm:max-w-[320px]">${idx + 1}. ${pName}</span>
                    <span class="text-amber-400 font-black">${pCount} clics (${pct}%)</span>
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

      <!-- Páginas de origen con más conversión -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 class="text-lg font-black text-white mb-4 flex items-center justify-between">
          <span>📍 Páginas de Origen más Convertidoras</span>
          <span class="text-xs text-slate-400 font-normal">Origen del clic</span>
        </h3>

        ${sortedPages.length === 0 ? `
          <p class="text-sm text-slate-500 py-8 text-center">Sin datos de origen por el momento.</p>
        ` : `
          <div class="space-y-4">
            ${sortedPages.map(([pagePath, pCount], idx) => {
              const pct = totalClicks > 0 ? Math.round((pCount / totalClicks) * 100) : 0;
              return `
                <div>
                  <div class="flex justify-between items-center text-xs font-bold mb-1">
                    <span class="text-slate-200 font-mono">${pagePath}</span>
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

    </div>

    <!-- Tabla de Historial en Tiempo Real -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
      <h3 class="text-lg font-black text-white mb-4">
        📋 Historial de Clics Recientes
      </h3>

      ${clicks.length === 0 ? `
        <p class="text-sm text-slate-500 py-8 text-center">El historial está vacío. Los clics futuros aparecerán aquí automáticamente.</p>
      ` : `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th class="p-3">Fecha / Hora</th>
                <th class="p-3">Producto</th>
                <th class="p-3">Página de Origen</th>
                <th class="p-3">Idioma</th>
                <th class="p-3 text-center">Dispositivo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              ${clicks.map(c => `
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

</body>
</html>`;
}
