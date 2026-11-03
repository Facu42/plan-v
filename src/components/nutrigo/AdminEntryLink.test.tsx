import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AdminEntryLink } from './AdminEntryLink';

describe('acceso visible a Admin', () => {
  it('apunta al centro de mando de este mismo sitio', () => {
    const html = renderToStaticMarkup(createElement(AdminEntryLink));
    expect(html).toContain('href="/admin"');
    expect(html).toContain('Admin');
    expect(html).not.toContain('http');
    expect(html).not.toContain('nutridash.ar');
  });
});
