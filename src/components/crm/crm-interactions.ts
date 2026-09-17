export function appointmentFormShouldStartEditing(current: unknown): boolean {
  void current;
  return true;
}

export function resolveCommandMessageAction(): { kind: 'focus_message_draft' } {
  return { kind: 'focus_message_draft' };
}

export function visibleBrief<T extends { suggested_action: unknown }>(brief: T | null, dismissed: boolean | undefined): T | null {
  if (!brief || dismissed) return null;
  return brief.suggested_action ? brief : null;
}
