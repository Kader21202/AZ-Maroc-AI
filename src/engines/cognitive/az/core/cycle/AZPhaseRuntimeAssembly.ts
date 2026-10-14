import {
  AZElaborationConvergenceRunner,
} from './AZElaborationConvergenceRunner'
import {
  AZElaborationActivityResolver,
} from './AZElaborationActivityResolver'
import {
  AZDefaultTopLevelPhaseController,
} from './AZTopLevelPhaseController'
import {
  AZTopLevelPhaseExecutor,
} from './AZTopLevelPhaseExecutor'
import type {
  AZElaborationRuntimeAssembly,
} from './AZElaborationRuntimeAssembly'
import type {
  AZDecisionRuntimeAssembly,
} from '../decision/AZDecisionRuntimeAssembly'
import {
  DefaultActiveGoalResolver,
} from '../state/DefaultActiveGoalResolver'
import type {
  AZIdentifierLinkStateRegistry,
} from '../state/AZIdentifierLinkStateRegistry'
import type {
  AZStateStack,
} from '../state/AZStateStack'
import type {
  AZMatchSet,
} from '../production/AZMatchSet'
import type {
  AZWorkingMemory,
} from '../memory/AZWorkingMemory'
import {
  AZIoState,
} from '../io/AZIoState'
import {
  AZInputPhase,
} from '../io/AZInputPhase'
import {
  AZDefaultInputPhaseEventHandler,
} from '../io/AZInputPhaseEventHandler'
import {
  AZOutputLinkManager,
} from '../io/AZOutputLinkManager'
import {
  AZOutputPhase,
} from '../phases/AZOutputPhase'

export interface AZPhaseRuntimeAssemblyDependencies {
  readonly elaborationRuntime:
    AZElaborationRuntimeAssembly

  readonly matchSet:
    AZMatchSet

  readonly stateStack:
    AZStateStack

  readonly identifierStateRegistry:
    AZIdentifierLinkStateRegistry

  readonly workingMemory:
    AZWorkingMemory

  readonly decisionRuntime:
    AZDecisionRuntimeAssembly

  readonly runControl?: {
    isHalted(): boolean
  }

  readonly ioState?: AZIoState

  readonly outputLinkManager?:
    AZOutputLinkManager

  readonly onNormalInputCycle?:
    () => void
}

/**
 * Composition root for the AZ top-level
 * cognitive phase path.
 *
 * Decision and context-consistency behavior
 * are supplied by the shared AZ decision
 * runtime assembly.
 */
export class AZPhaseRuntimeAssembly {
  public readonly ioState:
    AZIoState

  public readonly outputLinkManager:
    AZOutputLinkManager

  public readonly inputPhase:
    AZInputPhase

  public readonly activityResolver:
    AZElaborationActivityResolver

  public readonly convergenceRunner:
    AZElaborationConvergenceRunner

  public readonly controller:
    AZDefaultTopLevelPhaseController

  public readonly outputPhase:
    AZOutputPhase

  public readonly phaseExecutor:
    AZTopLevelPhaseExecutor

  public constructor(
    dependencies:
      AZPhaseRuntimeAssemblyDependencies,
  ) {
    this.ioState =
      dependencies.ioState ??
      new AZIoState()

    this.outputLinkManager =
      dependencies.outputLinkManager ??
      new AZOutputLinkManager(
        this.ioState,
      )

    this.inputPhase =
      new AZInputPhase(
        dependencies.stateStack,
        this.ioState,
        dependencies.workingMemory,
        new AZDefaultInputPhaseEventHandler(
          dependencies.onNormalInputCycle,
        ),
      )

    this.activityResolver =
      new AZElaborationActivityResolver(
        new DefaultActiveGoalResolver(),
        dependencies
          .identifierStateRegistry,
      )

    this.convergenceRunner =
      new AZElaborationConvergenceRunner(
        this.activityResolver,
        dependencies
          .elaborationRuntime
          .elaborationCycle,
        dependencies.matchSet,
        dependencies.stateStack,
        dependencies
          .decisionRuntime
          .consistencyProcessor,
        dependencies.runControl,
      )

    this.controller =
      new AZDefaultTopLevelPhaseController()

    this.outputPhase =
      new AZOutputPhase()

    this.phaseExecutor =
      new AZTopLevelPhaseExecutor(
        this.controller,
        this.inputPhase,
        this.convergenceRunner,
        dependencies
          .decisionRuntime
          .decideRuntime,
        this.outputPhase,
        this.outputLinkManager,
      )
  }
}
