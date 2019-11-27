export type Status = 'success' | 'failure' | 'cancelled';

export function parse(status: string): Status {
  const s = status.toLowerCase()
  switch (s) {
    case 'success':
    case 'failure':
    case 'cancelled':
      return s;
    default:
      throw Error(`Invalid parameter. status=${status}.`)
  }
}
