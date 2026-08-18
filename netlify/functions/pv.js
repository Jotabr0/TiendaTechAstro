import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

export default async (req, context) => {
  // Manejo de CORS / Preflight si fuese necesario
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    });
  }

  const urlParams = new URL(req.url).searchParams;
  const pagePath = urlParams.get('path') || '/';
  const lang = urlParams.get('lang') || 'es';

  const userAgent = req.headers.get('user-agent') || '';
  const clientIP = req.headers.get('x-nf-client-connection-ip') || req.headers.get('client-ip') || '127.0.0.1';

  // Filtro de Bots y Rastreadores conocidos para no contaminar visitas
  const isBot = /bot|crawler|spider|ahrefs|semrush|petalbot|googlebot|bingbot|yandex|facebookexternalhit|twitterbot|lighthouse|netlify/i.test(userAgent);

  if (!isBot) {
    try {
      const todayKey = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const visitorHash = createHash('md5').update(`${clientIP}_${userAgent}_${todayKey}`).digest('hex').substring(0, 12);

      const store = getStore({
        name: 'site-analytics-pv',
        consistency: 'strong'
      });

      // Obtener registro de páginas del día o inicializar
      const dailyStats = await store.get(`stats_${todayKey}`, { type: 'json' }) || {
        date: todayKey,
        totalViews: 0,
        uniqueVisitors: [],
        pages: {},
        lang: { es: 0, en: 0 }
      };

      dailyStats.totalViews += 1;
      if (!dailyStats.uniqueVisitors.includes(visitorHash)) {
        dailyStats.uniqueVisitors.push(visitorHash);
      }

      dailyStats.pages[pagePath] = (dailyStats.pages[pagePath] || 0) + 1;
      if (lang === 'en') dailyStats.lang.en += 1;
      else dailyStats.lang.es += 1;

      // Guardar datos del día
      await store.setJSON(`stats_${todayKey}`, dailyStats);

      // Mantener lista de días registrados
      const daysIndex = await store.get('days_index', { type: 'json' }) || [];
      if (!daysIndex.includes(todayKey)) {
        daysIndex.push(todayKey);
        daysIndex.sort().reverse(); // De más reciente a más antiguo
        await store.setJSON('days_index', daysIndex.slice(0, 90)); // Guardar últimos 90 días
      }

    } catch (err) {
      console.error('Error registrando Pageview:', err);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
