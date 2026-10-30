export function pessimisticWriteLock(
  driver: string,
): { mode: 'pessimistic_write' } | undefined {
  if (driver === 'sqlite') {
    return undefined;
  }
  return { mode: 'pessimistic_write' };
}
