# opentelemetry-decorators

Provides TypeScript decorators for easily integrating OpenTelemetry tracing and baggage management into class methods, supporting both synchronous and asynchronous operations. These decorators, such as `InSpan()` and `WithBaggage()`, simplify the process of adding telemetry data to your application's operations.

## Usage

All decorators work with both async and synchronous class methods.

```typescript
class CardService {
  // Run `CardService#attach` inside a span named `attach`
  @InSpan()
  async attach(input: AttachCardInput) {
    // ...
  }

  // Run `CardService#attach` inside a span named `CardService.attach`,
  // and attach a `userId` attribute to that span
  @InSpan('CardService.attach', (input) => ({ userId: input.userId }))
  async attach(input: AttachCardInput) {
    // ...
  }

  // When `CardService#remove` is called, add a `source: 'CardService.remove'`
  // baggage entry to the active OTel context
  @WithBaggage({ source: 'CardService.remove' })
  async remove(cardId: ResourceId<'card'>) {
    // ...
  }

  // When `CardService#remove` is called, add the removed card's ID as a baggage
  // entry to the active OTel context
  @WithBaggage((cardId) => ({ 'card.id': cardId }))
  async remove(cardId: ResourceId<'card'>) {
    // ...
  }
}
```
