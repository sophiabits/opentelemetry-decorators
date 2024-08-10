export type AFunction = (this: any, ...args: any[]) => any;

export type ClassMethodDecorator<TFn extends AFunction> = (
  target: TFn,
  context: ClassMethodDecoratorContext,
) => TFn | void;

export type ValueOrFn<TValue, TParams extends any[] = any[]> =
  | TValue
  | ((...args: TParams) => TValue);
