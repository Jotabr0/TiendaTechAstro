export const languages = {
  es: 'Español',
  en: 'English',
} as const;

export const defaultLang = 'es';

export const ui = {
  es: {
    // Categorías de Navegación
    'nav.sillasOficina': 'Sillas Oficina',
    'nav.sillasGaming': 'Sillas Gaming',
    'nav.mesas': 'Mesas',
    'nav.perifericos': 'Periféricos',
    'nav.ratones': 'Ratones',
    'nav.teclados': 'Teclados',
    'nav.auriculares': 'Auriculares',
    'nav.monitores': 'Monitores',
    'nav.altavoces': 'Altavoces',
    'nav.iluminacion': 'Iluminación',
    'nav.alfombrillas': 'Alfombrillas',
    'nav.humidificadores': 'Humidificadores',
    'nav.verTodoPerifericos': 'Ver Todo Periféricos',
    'nav.inicio': 'Inicio',

    // Amazon Box & Productos
    'amazon.verOferta': 'Ver oferta en Amazon',
    'amazon.verificado': 'Producto verificado en Amazon',
    'amazon.estrellas': 'de 5 estrellas',
    'amazon.precioRecomendado': 'Precio recomendado',
    'amazon.stockActualizado': 'Stock y precio actualizado hoy',
    'amazon.imagenDe': 'Imagen de',

    // Componentes Varios
    'prosContras.pros': 'Ventajas y Puntos Fuertes',
    'prosContras.contras': 'Aspectos a Tener en Cuenta',
    'tabla.producto': 'Producto',
    'tabla.destacado': 'Destacado',
    'tabla.valoracion': 'Valoración',
    'tabla.verEnAmazon': 'Ver en Amazon',

    // Footer & Legal
    'footer.avisoAfiliados': 'Aviso de Afiliación: En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables. Amazon y el logotipo de Amazon son marcas comerciales de Amazon.com, Inc. o de sociedades de su grupo.',
    'footer.preciosDisclaimer': 'Los precios y la disponibilidad de los productos son precisos en la fecha/hora de consulta y están sujetos a cambios por parte del vendedor.',
    'footer.navegacion': 'Navegación',
    'footer.empresa': 'Sobre ZenZone',
    'footer.sobreNosotros': 'Sobre Nosotros',
    'footer.metodologia': 'Metodología',
    'footer.contacto': 'Contacto',
    'footer.legal': 'Legal',
    'footer.avisoLegal': 'Aviso Legal',
    'footer.cookies': 'Política de Cookies',
    'footer.derechos': 'Guías de Ergonomía & Setup Personal. Todos los derechos reservados.',
  },
  en: {
    // Navigation Categories
    'nav.sillasOficina': 'Office Chairs',
    'nav.sillasGaming': 'Gaming Chairs',
    'nav.mesas': 'Desks',
    'nav.perifericos': 'Peripherals',
    'nav.ratones': 'Mice',
    'nav.teclados': 'Keyboards',
    'nav.auriculares': 'Headphones',
    'nav.monitores': 'Monitors',
    'nav.altavoces': 'Speakers',
    'nav.iluminacion': 'Lighting',
    'nav.alfombrillas': 'Mouse Pads',
    'nav.humidificadores': 'Humidifiers',
    'nav.verTodoPerifericos': 'View All Peripherals',
    'nav.inicio': 'Home',

    // Amazon Box & Products
    'amazon.verOferta': 'View offer on Amazon',
    'amazon.verificado': 'Verified product on Amazon',
    'amazon.estrellas': 'out of 5 stars',
    'amazon.precioRecomendado': 'Recommended price',
    'amazon.stockActualizado': 'Stock and price updated today',
    'amazon.imagenDe': 'Image of',

    // Miscellaneous Components
    'prosContras.pros': 'Pros & Strengths',
    'prosContras.contras': 'Things to Consider',
    'tabla.producto': 'Product',
    'tabla.destacado': 'Highlight',
    'tabla.valoracion': 'Rating',
    'tabla.verEnAmazon': 'View on Amazon',

    // Footer & Legal
    'footer.avisoAfiliados': 'Affiliate Disclosure: As an Amazon Associate I earn from qualifying purchases. Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.',
    'footer.preciosDisclaimer': 'Product prices and availability are accurate as of the date/time indicated and are subject to change.',
    'footer.navegacion': 'Navigation',
    'footer.empresa': 'About ZenZone',
    'footer.sobreNosotros': 'About Us',
    'footer.metodologia': 'Methodology',
    'footer.contacto': 'Contact',
    'footer.legal': 'Legal',
    'footer.avisoLegal': 'Legal Notice',
    'footer.cookies': 'Cookie Policy',
    'footer.derechos': 'Ergonomics & Personal Setup Guides. All rights reserved.',
  },
} as const;

export function getLangFromUrl(url: URL): 'es' | 'en' {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as 'es' | 'en';
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

/**
 * Normaliza y devuelve la ruta localizada según el idioma seleccionado.
 */
export function getRelativeLocaleUrl(lang: 'es' | 'en', path: string): string {
  // Limpia barra inicial si la tiene
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Elimina /en si ya existe en la ruta
  const pathWithoutLang = cleanPath.replace(/^\/en(\/|$)/, '/');

  if (lang === 'en') {
    return pathWithoutLang === '/' ? '/en/' : `/en${pathWithoutLang}`;
  }

  return pathWithoutLang === '' ? '/' : pathWithoutLang;
}
