import { ValueOrFn } from './types';

export function isPromiseLike(obj: any): obj is PromiseLike<unknown> {
  return obj && typeof obj.then === 'function';
}

export function valueOf<T>(valueOrFn: ValueOrFn<T>, args: any[]): T;
export function valueOf<T>(valueOrFn: ValueOrFn<T> | undefined, args: any[]): T | undefined;
export function valueOf<T>(valueOrFn: ValueOrFn<T> | undefined, args: any[]): T | undefined {
  if (!valueOrFn) {
    return undefined;
  } else if (typeof valueOrFn === 'function') {
    // @ts-expect-error
    return valueOrFn(...args);
  } else {
    return valueOrFn;
  }
}
