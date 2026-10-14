import type { Mission } from '../../models/Mission'
import type { CognitiveEventHandler } from './az/events/CognitiveEventHandler'
import type { CycleObservationHandler } from './az/monitoring/CycleObservationHandler'
import type { CognitiveLineageObservationHandler } from './az/monitoring/CognitiveLineageObservationHandler'
import type { KnowledgeSource } from './az/knowledge/KnowledgeSource'
import { DefaultAZKnowledgeProductionFactory } from './az/knowledge/DefaultAZKnowledgeProductionFactory'
import { CognitiveEventContextDecisionObserver } from './az/monitoring/CognitiveEventContextDecisionObserver'
import { CognitiveEventProgressMonitor } from './az/monitoring/CognitiveEventProgressMonitor'
import { ProgressMonitor } from './az/monitoring/ProgressMonitor'
import type { ICognitiveEngine } from './ICognitiveEngine'
import { AZCognitiveRuntimeAssembly } from './az/core/AZCognitiveRuntimeAssembly'
import { AZInputWmeRegistry } from './az/core/io/AZInputWmeRegistry'
import { AZInputWmeManager } from './az/core/io/AZInputWmeManager'
import { AZIoStructureInitializer } from './az/core/io/AZIoStructureInitializer'
import { AZCycleObservationBuilder } from './AZCycleObservationBuilder'
import { AZCognitiveLineageObserver } from './az/monitoring/AZCognitiveLineageObserver'
import { DefaultAZMultiStepProductionFactory } from './az/kernel/DefaultAZMultiStepProductionFactory'
import type { AZMultiStepProductionFactory, AZMultiStepProductionFactoryDependencies } from './az/kernel/AZMultiStepProductionFactory'


export interface AZNativeCognitiveResult {
  readonly engine: 'az-native'
  readonly question: string
  readonly answer: string
}

export class AZNativeCognitiveEngine
  implements ICognitiveEngine
{
  public constructor(
    private readonly cognitiveEventHandler?:
      CognitiveEventHandler,

    private readonly cycleObservationHandler?:
      CycleObservationHandler,

    private readonly knowledgeSource?:
      KnowledgeSource,

    private readonly multiStepProductionFactoryProvider?:
      (dependencies: AZMultiStepProductionFactoryDependencies) =>
        AZMultiStepProductionFactory,

    private readonly cognitiveLineageObservationHandler?:
      CognitiveLineageObservationHandler,
  ) {}

  public async process(
    mission: Mission,
  ): Promise<Mission> {
    mission.status = 'RUNNING'

    try {
      const question =
        this.getQuestion(mission.request)

      const contextDecisionObserver =
        this.cognitiveEventHandler === undefined
          ? undefined
          : new CognitiveEventContextDecisionObserver(
              this.cognitiveEventHandler,
            )

      let publishInput:
        (() => void) | undefined

      const runtime =
        new AZCognitiveRuntimeAssembly(
          () => publishInput?.(),
          contextDecisionObserver,
        )

      const symbols =
        runtime.symbolManager

      const predefinedSymbols =
        runtime.predefinedSymbols

      const workingMemory =
        runtime.workingMemory

      const stateIdentifier =
        symbols.makeIdentifier('S')

      runtime.decisionRuntime
        .goalContextInitializer
        .initialize(
          stateIdentifier,
          1,
        )

      runtime.contextStack.setTop(
        stateIdentifier,
      )

      runtime.stateStack.setTop(
        {},
        stateIdentifier,
      )

      const inputWmeRegistry =
        new AZInputWmeRegistry()

      const inputWmeManager =
        new AZInputWmeManager(
          workingMemory,
          inputWmeRegistry,
        )

      const ioStructureInitializer =
        new AZIoStructureInitializer(
          symbols,
          predefinedSymbols,
          inputWmeManager,
          runtime.identifierStateRegistry,
        )

      ioStructureInitializer.initialize(
        stateIdentifier,
        runtime.ioState,
      )

      const inputLinkIdentifier =
        runtime.ioState.inputLink

      if (inputLinkIdentifier === null) {
        throw new Error(
          'AZ input link was not initialized',
        )
      }

      const outputLinkIdentifier =
        runtime.ioState.outputLink

      if (outputLinkIdentifier === null) {
        throw new Error(
          'AZ output link was not initialized',
        )
      }

      const questionAttribute =
        symbols.makeStringConstant(
          'question',
        )

      const resultAttribute =
        symbols.makeStringConstant(
          'result',
        )

      const knowledgeResultAttribute =
        symbols.makeStringConstant(
          'knowledge-result',
        )

      const questionValue =
        symbols.makeStringConstant(
          question,
        )

      const multiStepProductionFactory =
        this.multiStepProductionFactoryProvider ===
        undefined
          ? new DefaultAZMultiStepProductionFactory({
              symbols,
              predefinedSymbols,
            })
          : this.multiStepProductionFactoryProvider({
              symbols,
              predefinedSymbols,
            })

      const knowledgeProductionFactory =
        this.knowledgeSource === undefined
          ? null
          : new DefaultAZKnowledgeProductionFactory({
              symbols,
              predefinedSymbols,
            })

      const installProduction = (
        production:
          ReturnType<
            AZMultiStepProductionFactory[
              'createProposalProductions'
            ]
          >[number],
      ) => {
        runtime.productionRuntime
          .productionInstaller
          .install(
            runtime.productionRuntime
              .productionMaterializer
              .materialize(production),
          )
      }

      for (
        const production of
        multiStepProductionFactory
          .createProposalProductions()
      ) {
        installProduction(production)
      }

      if (knowledgeProductionFactory !== null) {
        for (
          const production of
          knowledgeProductionFactory
            .createProposalProductions()
        ) {
          installProduction(production)
        }
      }

      for (
        const production of
        multiStepProductionFactory
          .createApplicationProductions(
            outputLinkIdentifier,
          )
      ) {
        installProduction(production)
      }

      if (knowledgeProductionFactory !== null) {
        for (
          const production of
          knowledgeProductionFactory
            .createApplicationProductions(
              outputLinkIdentifier,
            )
        ) {
          installProduction(production)
        }
      }

      let inputPublished = false

      publishInput = () => {
        if (inputPublished) {
          return
        }

        inputWmeManager.add(
          inputLinkIdentifier,
          questionAttribute,
          questionValue,
        )

        const knowledgeResult =
          this.knowledgeSource?.lookup(
            question,
          ) ?? null

        if (knowledgeResult !== null) {
          inputWmeManager.add(
            inputLinkIdentifier,
            knowledgeResultAttribute,
            symbols.makeStringConstant(
              knowledgeResult,
            ),
          )
        }

        inputPublished = true
      }
      const maxElaborationSteps = 1000
      const maxDecisionCycles = 100

      let lastResult:
        string | null = null

      const cycleObservationBuilder =
        new AZCycleObservationBuilder()

      const progressMonitor =
        new ProgressMonitor()

      const cognitiveEventProgressMonitor =
        this.cognitiveEventHandler === undefined
          ? undefined
          : new CognitiveEventProgressMonitor(
              this.cognitiveEventHandler,
            )

      const cognitiveLineageObserver =
        this.cognitiveLineageObservationHandler ===
        undefined
          ? undefined
          : new AZCognitiveLineageObserver(
              runtime.causalProvenanceRegistry,
              this.cognitiveLineageObservationHandler,
            )

      const readCurrentPhase = () =>
        runtime.phaseRuntime.controller
          .currentPhase

      const executeOnePhase = () =>
        runtime.phaseRuntime.phaseExecutor
          .executeOnePhase()

      const observeCognitiveLineage = (
        execution:
          ReturnType<
            typeof executeOnePhase
          >,
      ) => {
        cognitiveLineageObserver?.observe(
          execution.elaboration
            ?.waterfall
            .createdInstantiations ?? [],
        )
      }

      for (
        let decisionCycleCount = 1;
        decisionCycleCount <=
          maxDecisionCycles;
        decisionCycleCount += 1
      ) {
        if (
          readCurrentPhase() !==
          'INPUT'
        ) {
          throw new Error(
            'AZ expected INPUT at decision-cycle start.',
          )
        }

        executeOnePhase()

        let proposeStepCount = 0

        while (
          readCurrentPhase() ===
          'PROPOSE'
        ) {
          proposeStepCount += 1

          if (
            proposeStepCount >
            maxElaborationSteps
          ) {
            throw new Error(
              'AZ PROPOSE phase did not converge.',
            )
          }

          const execution =
            executeOnePhase()

          observeCognitiveLineage(
            execution,
          )
        }

        if (
          readCurrentPhase() !==
          'DECIDE'
        ) {
          throw new Error(
            'AZ expected DECIDE after PROPOSE convergence.',
          )
        }

        executeOnePhase()

        let applyStepCount = 0

        while (
          readCurrentPhase() ===
          'APPLY'
        ) {
          applyStepCount += 1

          if (
            applyStepCount >
            maxElaborationSteps
          ) {
            throw new Error(
              'AZ APPLY phase did not converge.',
            )
          }

          const execution =
            executeOnePhase()

          observeCognitiveLineage(
            execution,
          )
        }

        if (
          readCurrentPhase() !==
          'OUTPUT'
        ) {
          throw new Error(
            'AZ expected OUTPUT after APPLY convergence.',
          )
        }

        const outputExecution =
          executeOnePhase()

        if (
          outputExecution
            .outputCommands.length > 0
        ) {
          this.cognitiveEventHandler?.handle({
            type: 'OUTPUT_PRODUCED',
          })
        }

        const resultCommand =
          outputExecution.outputCommands.find(
            command =>
              command.outputLink
                .linkWme.identifier ===
                  outputLinkIdentifier &&
              command.outputLink
                .linkWme.attribute ===
                  resultAttribute,
          )

        if (resultCommand !== undefined) {
          lastResult =
            resultCommand.mode === 'REMOVED'
              ? null
              : String(
                  resultCommand.outputLink
                    .linkWme.value.value,
                )
        }

        this.cognitiveEventHandler?.handle({
          type: 'DECISION_CYCLE_COMPLETED',
          cycle: decisionCycleCount,
        })

        const cycleObservation =
          cycleObservationBuilder.build(
            decisionCycleCount,
            runtime.stateStack,
            runtime.structuralRegistry,
            workingMemory,
            runtime.runControl,
            outputExecution
              .outputCommands.length > 0,
          )

        cognitiveEventProgressMonitor?.handle(
          cycleObservation,
        )

        progressMonitor.handle(
          cycleObservation,
        )

        if (
          progressMonitor
            .getNonProgressCause() ===
          'GROWING_ONC_RECURSION'
        ) {
          runtime.runControl.halt(
            'Cognitive non-progress detected: GROWING_ONC_RECURSION.',
          )
        }

        this.cycleObservationHandler?.handle(
          cycleObservation,
        )

        if (runtime.runControl.isHalted()) {
          if (lastResult === null) {
            mission.result = {
              engine: 'az-native',
              question,
              answer:
                runtime.runControl
                  .reasonForStopping() ??
                'AZ halted without producing a result.',
            }

            mission.status = 'FAILED'
            return mission
          }

          mission.result = {
            engine: 'az-native',
            question,
            answer: lastResult,
          }

          mission.status = 'COMPLETED'
          return mission
        }
      }

      throw new Error(
        'AZ exceeded the maximum number of decision cycles.',
      )
    } catch (error: unknown) {
      mission.result = {
        engine: 'az-native',
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }

      mission.status = 'FAILED'
    }

    return mission
  }
  private getQuestion(
    request: unknown,
  ): string {
    if (
      typeof request !== 'string' ||
      request.trim().length === 0
    ) {
      throw new Error(
        'AZ native mission request must be a non-empty string',
      )
    }

    return request.trim()
  }
}
