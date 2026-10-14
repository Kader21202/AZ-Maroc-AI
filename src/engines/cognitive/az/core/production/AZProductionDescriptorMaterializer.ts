import type { AZProduction } from './AZProduction'
import type { AZProductionDescriptor } from './AZProductionDescriptor'

export class AZProductionDescriptorMaterializer {
  public materialize(
    descriptor: AZProductionDescriptor,
  ): AZProduction {
    return {
      name: descriptor.name,
      declaredSupport:
        descriptor.declaredSupport,
      conditions:
        descriptor.conditions,
      actions: [...descriptor.actions],
      instantiations: [],
      productionNode: null,
    }
  }
}
