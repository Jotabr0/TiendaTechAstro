import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders'; // <-- Importamos el loader oficial

const reviewsCollection = defineCollection({
  // 1. Usamos un loader para buscar todos los MDX en la carpeta reviews
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/reviews" }),
  
  // 2. El esquema Zod sigue igual, pero convertimos la fecha con z.coerce.date()
  schema: z.object({
    title: z.string(),
    description: z.string().max(160, "El SEO title no debe superar 160 caracteres"),
    category: z.enum([
      'humidificadores', 'iluminacion', 'alfombrillas', 
      'soportes', 'sillas-oficina', 'sillas-gaming', 
      'mesas-escritorio', 'perifericos'
    ]),
    pubDate: z.coerce.date(),
    coverImage: z.string().optional(),
  }),
});

export const collections = {
  'reviews': reviewsCollection,
};