import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react';
import { NvButton } from '../primitives';
import { HELP_ARTICLES, HELP_CATEGORIES, helpArticleOf, helpCategoryOf, type HelpArticle, type HelpCategoryId } from './help-articles';
import { helpResultLabel, searchHelp } from './help-search';
import './help-center.css';

const FEATURED_PER_CATEGORY = 3;

type Props = {
  /** Abre otra pantalla del consultorio (ruta /crm/...). */
  onNavigate: (href: string) => void;
  initialQuery?: string;
  initialArticleId?: string | null;
};

function syncUrl(articleId: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (articleId) url.searchParams.set('articulo', articleId); else url.searchParams.delete('articulo');
    window.history.pushState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch { /* La navegación interna sigue funcionando sin actualizar la barra de direcciones. */ }
}

function QuestionButton({ article, onOpen, showAnswer = false }: { article: HelpArticle; onOpen: (id: string) => void; showAnswer?: boolean }) {
  return <button type="button" className="hc-question" onClick={() => onOpen(article.id)}>
    {showAnswer && <small>{helpCategoryOf(article.category).title}</small>}
    <strong>{article.title}</strong>
    {showAnswer && <span>{article.summary}</span>}
  </button>;
}

export function HelpCenter({ onNavigate, initialQuery = '', initialArticleId = null }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [articleId, setArticleId] = useState<string | null>(initialArticleId);
  const [categoryId, setCategoryId] = useState<HelpCategoryId | null>(null);
  const article = helpArticleOf(articleId);
  const missingArticle = Boolean(articleId) && !article;
  const results = useMemo(() => searchHelp(query), [query]);
  const searching = query.trim().length > 0;

  const open = (id: string) => { setArticleId(id); syncUrl(id); };
  const backToList = () => { setArticleId(null); syncUrl(null); };

  if (article) {
    const category = helpCategoryOf(article.category);
    const related = article.related.map(id => helpArticleOf(id)).filter((item): item is HelpArticle => Boolean(item));
    return <article className="hc-article" aria-labelledby="hc-article-title">
      <nav className="hc-crumbs" aria-label="Ruta">
        <button type="button" onClick={() => { setCategoryId(null); setQuery(''); backToList(); }}>Centro de ayuda</button>
        <span aria-hidden="true">/</span>
        <button type="button" onClick={() => { setCategoryId(article.category); setQuery(''); backToList(); }}>{category.title}</button>
      </nav>
      <h2 id="hc-article-title">{article.title}</h2>
      <p className="hc-lead">{article.summary}</p>
      <ol className="hc-steps">{article.steps.map(step => <li key={step}>{step}</li>)}</ol>
      {article.tip && <p className="hc-tip"><strong>Para tener en cuenta.</strong> {article.tip}</p>}
      <div className="hc-goto"><NvButton onClick={() => onNavigate(article.goTo.href)}>{article.goTo.label} <ArrowRight size={15} aria-hidden="true" /></NvButton></div>
      {related.length > 0 && <section aria-labelledby="hc-related-title" className="hc-related">
        <h3 id="hc-related-title">Artículos relacionados</h3>
        <div>{related.map(item => <QuestionButton key={item.id} article={item} onOpen={open} />)}</div>
      </section>}
    </article>;
  }

  const category = categoryId ? helpCategoryOf(categoryId) : null;
  const submit = (event: FormEvent) => event.preventDefault();

  return <section className="hc-page" aria-label="Centro de ayuda">
    <header className="hc-head">
      <h2>¿En qué te damos una mano?</h2>
      <p>Respuestas paso a paso sobre cada parte de tu consultorio.</p>
      <form className="hc-search" role="search" onSubmit={submit}>
        <MagnifyingGlass size={18} aria-hidden="true" />
        <input type="search" aria-label="Buscar en el Centro de ayuda" placeholder="Buscá una pregunta o una palabra…" value={query} onChange={event => { setQuery(event.target.value); setCategoryId(null); }} />
      </form>
    </header>
    {missingArticle && <p className="hc-note" role="status">No encontramos ese artículo. Puede que se haya movido: buscalo acá abajo.</p>}
    {searching ? <>
      <p className="hc-count" role="status" aria-live="polite">{helpResultLabel(results.length, query.trim())}</p>
      {results.length ? <div className="hc-results">{results.map(item => <QuestionButton key={item.id} article={item} onOpen={open} showAnswer />)}</div>
        : <div className="hc-empty"><p>Probá con otras palabras, por ejemplo «turno», «plan» o «pago».</p><NvButton className="nv-ghost" onClick={() => setQuery('')}>Ver todas las categorías</NvButton></div>}
    </> : category ? <section aria-labelledby="hc-category-title" className="hc-category">
      <button type="button" className="hc-back" onClick={() => setCategoryId(null)}>← Todas las categorías</button>
      <h3 id="hc-category-title">{category.title}</h3>
      <p>{category.description}</p>
      <div className="hc-results">{HELP_ARTICLES.filter(item => item.category === category.id).map(item => <QuestionButton key={item.id} article={item} onOpen={open} showAnswer />)}</div>
    </section> : <div className="hc-grid">{HELP_CATEGORIES.map(item => {
      const inCategory = HELP_ARTICLES.filter(candidate => candidate.category === item.id);
      return <section key={item.id} className="hc-card" aria-labelledby={`hc-cat-${item.id}`}>
        <h3 id={`hc-cat-${item.id}`}>{item.title}</h3>
        <p>{item.description}</p>
        <ul>{inCategory.slice(0, FEATURED_PER_CATEGORY).map(candidate => <li key={candidate.id}><button type="button" onClick={() => open(candidate.id)}>{candidate.title}</button></li>)}</ul>
        <button type="button" className="hc-more" onClick={() => setCategoryId(item.id)}>Ver {inCategory.length === 1 ? 'el artículo' : `los ${inCategory.length} artículos`} <ArrowRight size={14} aria-hidden="true" /></button>
      </section>;
    })}</div>}
  </section>;
}
