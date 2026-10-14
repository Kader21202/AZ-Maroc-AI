import { isAZBinaryPreferenceType } from '../operator/AZPreferenceTypeSemantics'
import type { AZProductionAction } from './AZProductionAction'
import type {
  AZRhsCompilationContext,
  AZRhsValueCompiler,
} from './AZRhsValueCompiler'

export interface AZProductionActionCompiler {
  compile(
    action: AZProductionAction,
    bottomDepth: number,
    context: AZRhsCompilationContext,
  ): AZProductionAction
}

export class AZDefaultProductionActionCompiler
  implements AZProductionActionCompiler
{
  public constructor(
    private readonly rhsValueCompiler:
      AZRhsValueCompiler,
  ) {}

  public compile(
    action: AZProductionAction,
    bottomDepth: number,
    context: AZRhsCompilationContext,
  ): AZProductionAction {
    switch (action.type) {
      case 'FUNCALL':
        return {
          type: 'FUNCALL',
          functionCall:
            this.rhsValueCompiler.compile(
              action.functionCall,
              bottomDepth,
              context,
            ),
        }

      case 'MAKE': {
        const binary =
          isAZBinaryPreferenceType(
            action.preferenceType,
          )

        if (
          binary &&
          action.referent === undefined
        ) {
          throw new Error(
            `Binary production preference ${action.preferenceType} requires a referent`,
          )
        }

        const compiledValue =
          this.rhsValueCompiler.compile(
            action.value,
            bottomDepth,
            context,
          )

        const compiledIdentifier =
          this.rhsValueCompiler.compile(
            action.identifier,
            bottomDepth,
            context,
          )

        const compiledAttribute =
          this.rhsValueCompiler.compile(
            action.attribute,
            bottomDepth,
            context,
          )

        const compiledReferent =
          binary
            ? this.rhsValueCompiler.compile(
                action.referent!,
                bottomDepth,
                context,
              )
            : undefined

        return {
          type: 'MAKE',
          preferenceType:
            action.preferenceType,
          identifier:
            compiledIdentifier,
          attribute:
            compiledAttribute,
          value:
            compiledValue,
          ...(binary
            ? {
                referent:
                  compiledReferent!,
              }
            : {}),
          support: action.support,
        }
      }
    }
  }
}
