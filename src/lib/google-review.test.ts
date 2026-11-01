import { describe, expect, it } from 'vitest';
import { googleReviewLink, isGoogleBusinessUrl, planReviewDelivery, reviewRequestText } from './google-review';

describe('link de reseña de Google', () => {
  it('arma el link de g.page y de placeid, y rechaza otros hosts', () => {
    expect(googleReviewLink('https://g.page/ana-nutri')).toBe('https://g.page/ana-nutri/review');
    expect(googleReviewLink('https://g.page/r/AbCdEf123456/review')).toBe('https://g.page/r/AbCdEf123456/review');
    expect(googleReviewLink('https://search.google.com/local/writereview?placeid=ChIJabcdefghij')).toBe('https://search.google.com/local/writereview?placeid=ChIJabcdefghij');
    expect(googleReviewLink('https://www.google.com/maps?query_place_id=ChIJabcdefghij')).toBe('https://search.google.com/local/writereview?placeid=ChIJabcdefghij');
    expect(googleReviewLink('http://g.page/ana-nutri')).toBeNull();
    expect(googleReviewLink('https://evil.example/g.page/ana')).toBeNull();
    expect(googleReviewLink('https://g.page.evil.com/ana')).toBeNull();
    expect(googleReviewLink('https://maps.app.goo.gl/abc')).toBeNull();
    expect(isGoogleBusinessUrl('https://g.page/ana-nutri')).toBe(true);
    expect(isGoogleBusinessUrl('')).toBe(true);
  });

  it('no manda la reseña si hay baja y el texto no lleva datos clínicos', () => {
    const link = googleReviewLink('https://g.page/ana-nutri')!;
    const blocked = planReviewDelivery(link, { campaignOptOut: true, inApp: true, email: true, broadcasts: true });
    expect(blocked.delivered).toBe('none');
    expect(blocked.channels).toEqual({ chat: 'opt_out', email: 'opt_out', whatsapp: 'opt_out' });
    const open = planReviewDelivery(link, { campaignOptOut: false, inApp: true, email: false, broadcasts: false });
    expect(open.delivered).toBe('chat');
    expect(open.channels).toEqual({ chat: 'sent', email: 'opt_out', whatsapp: 'opt_out' });
    expect(open.text).toBe(reviewRequestText(link));
    expect(open.text).toContain('https://g.page/ana-nutri/review');
    expect(open.text).not.toMatch(/glucemia|peso|paciente@|diagnóstico/i);
    expect(planReviewDelivery(link, null).delivered).toBe('none');
    const sinChat = planReviewDelivery(link, { campaignOptOut: false, inApp: false, email: true, broadcasts: false });
    expect(sinChat.delivered).toBe('none');
    expect(sinChat.channels.email).toBe('not_sent');
  });
});
