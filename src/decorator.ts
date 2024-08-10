import {
  type Attributes,
  type BaggageEntry,
  context,
  propagation,
  type Span,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api';

import type { AFunction, ClassMethodDecorator, ValueOrFn } from './types';
import { isPromiseLike, valueOf } from './util';

/**
 * Wraps execution of the decorated method inside a [span](https://opentelemetry.io/docs/concepts/signals/traces/#spans).
 *
 * @param name The name of the span. If not provided, the name of the method will be used.
 * @param attrs A set of attributes to be added to the span. If a function is provided, it will be called with the arguments of the decorated method.
 */
export function InSpan<TFn extends AFunction>(
  name?: string,
  attrs?: ValueOrFn<Attributes, Parameters<TFn>>,
): ClassMethodDecorator<TFn> {
  return (target, decoratorContext) => {
    if (decoratorContext.kind !== 'method') {
      return;
    }

    const spanName = name || decoratorContext.name.toString() || 'unknown';

    return function (...args) {
      const tracer = trace.getTracer('default');
      const span = tracer.startSpan(spanName, {
        attributes: valueOf(attrs, args),
      });
      const ctx = trace.setSpan(context.active(), span);

      return context.with(ctx, () => {
        try {
          const result = target.apply(this, args);

          if (isPromiseLike(result)) {
            return result.then(
              (value) => handleSuccess(span, value),
              (reason) => handleFailure(span, reason),
            );
          } else {
            return handleSuccess(span, result);
          }
        } catch (error) {
          handleFailure(span, error);
        }
      });
    } as TFn;
  };
}

/**
 * Adds [baggage](https://opentelemetry.io/docs/concepts/signals/baggage/) to the current context before executing the decorated method.
 *
 * The baggage is added to the current context and is available to all spans created within the context.
 *
 * Baggage added by this decorator is merged with any existing baggage in the current context.
 *
 * @param values A set of key-value pairs to be added to the baggage. If a function is provided, it will be called with the arguments of the decorated method.
 */
export function WithBaggage<TFn extends AFunction>(
  values: ValueOrFn<Record<string, string>, Parameters<TFn>>,
): ClassMethodDecorator<TFn> {
  return (target, decoratorContext) => {
    if (decoratorContext.kind !== 'method') {
      return;
    }

    return function (this: ThisParameterType<typeof target>, ...args: any[]) {
      const baggageEntries: Record<string, BaggageEntry> = {};

      const existingBaggage = propagation.getBaggage(context.active());
      if (existingBaggage) {
        for (const [key, entry] of existingBaggage.getAllEntries()) {
          baggageEntries[key] = entry;
        }
      }

      for (const [key, value] of Object.entries(valueOf(values, args))) {
        baggageEntries[key] = { value };
      }

      const baggage = propagation.createBaggage(baggageEntries);

      const ctx = propagation.setBaggage(context.active(), baggage);
      return context.with(ctx, () => target.apply(this, args));
    } as TFn;
  };
}

function handleSuccess<T>(span: Span, value: T): T {
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
  return value;
}

function handleFailure(span: Span, error: unknown): never {
  span.setStatus({ code: SpanStatusCode.ERROR });
  if (error instanceof Error || typeof error === 'string') {
    span.recordException(error);
  }
  span.end();

  throw error;
}
