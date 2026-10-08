import { useEffect, useRef } from 'react';

/** Accepts only the escaped document produced by planPrintHtml, never uploaded HTML. */
export function PlanPrintPreview({ html, title, onReady }: { html: string; title: string; onReady: (ready: boolean) => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    let active = true;
    onReady(false);
    const root = host.current.shadowRoot ?? host.current.attachShadow({ mode: 'open' });
    const documentCopy = new DOMParser().parseFromString(html, 'text/html');
    const style = document.createElement('style');
    // Scope document typography to the preview without changing application styles.
    style.textContent = (documentCopy.querySelector('style')?.textContent ?? '').replace(/\bbody\{/g, ':host{');
    root.replaceChildren(style, ...Array.from(documentCopy.body.childNodes, node => document.importNode(node, true)));
    const images = Array.from(root.querySelectorAll('img'));
    const waiting = images.map(image => image.complete ? Promise.resolve() : new Promise<void>(resolve => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => resolve(), { once: true });
    }));
    void Promise.all(waiting).then(() => { if (active) onReady(true); });
    return () => { active = false; };
  }, [html, onReady]);
  return <div ref={host} className="plan-print-preview" role="document" aria-label={title} />;
}
