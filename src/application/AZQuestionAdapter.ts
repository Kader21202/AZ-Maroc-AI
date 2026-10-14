import type { Mission } from "../models/Mission"
import type { IOrchestrator } from "../orchestrator/IOrchestrator"
import { AZNativeOrchestrator } from "../orchestrator/AZNativeOrchestrator"

export interface AZQuestionAdapterOptions {
  readonly orchestrator?: IOrchestrator
  readonly createId?: () => string
}

export interface AZQuestionResult {
  readonly missionId: string
  readonly status: Mission["status"]
  readonly result: unknown | null
}

export class AZQuestionAdapter {
  private readonly orchestrator: IOrchestrator
  private readonly createId: () => string

  public constructor(
    options: AZQuestionAdapterOptions = {},
  ) {
    this.orchestrator =
      options.orchestrator ??
      new AZNativeOrchestrator()

    this.createId =
      options.createId ??
      (() => crypto.randomUUID())
  }

  public async ask(
    question: string,
  ): Promise<AZQuestionResult> {
    const normalizedQuestion =
      question.trim()

    if (!normalizedQuestion) {
      throw new Error(
        "AZ question must be a non-empty string",
      )
    }

    const mission: Mission = {
      id: this.createId(),
      request: normalizedQuestion,
      status: "CREATED",
      workingState: {
        situation: {},
        goals: [],
        activeAction: null,
        intermediateResults: [],
      },
      result: null,
    }

    const completedMission =
      await this.orchestrator.execute(mission)

    return {
      missionId: completedMission.id,
      status: completedMission.status,
      result: completedMission.result,
    }
  }
}
