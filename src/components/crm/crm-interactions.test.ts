import { describe, expect, it } from 'vitest';
import { appointmentFormShouldStartEditing, resolveCommandMessageAction, visibleBrief } from './crm-interactions';

describe('CRM interaction states', () => {
  it('opens appointment preparation directly in editing mode', () => {
    expect(appointmentFormShouldStartEditing(null)).toBe(true);
    expect(appointmentFormShouldStartEditing({ when: 'Jueves · 14:30', duration: 45, channel: 'video' })).toBe(true);
  });

  it('routes the commandbar message action to the existing summary draft', () => {
    expect(resolveCommandMessageAction()).toEqual({ kind: 'focus_message_draft' });
  });

  it('hides dismissed or empty briefs from the summary action', () => {
    const brief = { suggested_action: 'mensaje' };
    expect(visibleBrief(brief, false)).toBe(brief);
    expect(visibleBrief(brief, true)).toBeNull();
    expect(visibleBrief({ suggested_action: null }, false)).toBeNull();
    expect(visibleBrief(null, false)).toBeNull();
  });
});
