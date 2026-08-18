import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const urlParams = new URL(req.url).searchParams;
  const targetUrl = urlParams.get('url');
  const productName = urlParams.get('name') || 'Producto Amazon';
  const pagePath = urlParams.get('page') || '/';
  const lang = urlParams.get('lang') || 'es';

  // Si no hay URL de destino, redirigir a la home
  if (!targetUrl) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/' }
    });
  }

  const userAgent = req.headers.get('user-agent') || '';
  const clientIP = req.headers.get('x-nf-client-connection-ip') || req.headers.get('client-ip') || '127.0.0.1';

  // Filtro de Bots y Rastreadores conocidos para no contaminar estadísticas
  const isBot = /bot|crawler|spider|ahrefs|semrush|petalbot|googlebot|bingbot|yandex|facebookexternalhit|twitterbot|lighthouse|netlify/i.test(userAgent);

  if (!isBot) {
    try {
      const store = getStore({
        name: 'affiliate-click-logs',
        consistency: 'strong'
      });

      // Recuperar clics existentes o iniciar array
      const existingData = await store.get('clicks_data', { type: 'json' }) || [];

      const now = new Date();
      const newClick = {
        id: 'clk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        timestamp: now.toISOString(),
        dateKey: now.toISOString().split('T')[0],
        name: productName,
        url: targetUrl,
        page: pagePath,
        lang: lang,
        ua: userAgent,
        ip: clientIP
      };

      // Mantener los últimos 500 clics reales
      const updatedData = [newClick, ...existingData].slice(0, 500);

      await store.setJSON('clicks_data', updatedData);
    } catch (err) {
      console.error('Error registrando clic en Netlify Blobs:', err);
    }
  }

  // Redirección HTTP 302 Inmediata a Amazon
  return new Response(null, {
    status: 302,
    headers: {
      'Location': targetUrl,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
};
