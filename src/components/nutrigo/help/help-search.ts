import { normalizeFoodSearch } from '../../../types/foods';
import { HELP_ARTICLES, helpCategoryOf, type HelpArticle } from './help-articles';

const words = (value: string) => normalizeFoodSearch(value).split(' ').filter(Boolean);

type Field = { text: string; weight: number };
const fieldsOf = (article: HelpArticle): Field[] => [
  { text: article.title, weight: 6 },
  { text: article.keywords.join(' '), weight: 4 },
  { text: article.summary, weight: 3 },
  { text: helpCategoryOf(article.category).title, weight: 2 },
  { text: [...article.steps, article.tip ?? ''].join(' '), weight: 1 },
];

/** Todas las palabras tienen que aparecer; gana el artículo cuyo título y palabras clave coinciden. */
export function searchHelp(query: string, articles: readonly HelpArticle[] = HELP_ARTICLES): HelpArticle[] {
  const tokens = words(query);
  if (!tokens.length) return [];
  return articles
    .map((article, order) => {
      const fields = fieldsOf(article).map(field => ({ weight: field.weight, text: normalizeFoodSearch(field.text) }));
      let score = 0;
      for (const token of tokens) {
        const best = Math.max(0, ...fields.filter(field => field.text.includes(token)).map(field => field.weight));
        if (!best) return null;
        score += best;
      }
      return { article, score, order };
    })
    .filter((hit): hit is { article: HelpArticle; score: number; order: number } => hit !== null)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(hit => hit.article);
}

export function helpResultLabel(count: number, query: string) {
  if (count === 0) return `Sin resultados para «${query}»`;
  return `${count} ${count === 1 ? 'resultado' : 'resultados'} para «${query}»`;
}
