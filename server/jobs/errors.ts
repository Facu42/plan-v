export class PermanentJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentJobError';
  }
}

export function jobErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'job_failed';
  if (error instanceof PermanentJobError) return `permanent:${message}`;
  return message;
}
