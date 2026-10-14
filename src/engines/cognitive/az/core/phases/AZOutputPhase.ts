import type { AZOutputCommand } from '../io/AZOutputCommand'
import type { AZOutputLinkManager } from '../io/AZOutputLinkManager'

export class AZOutputPhase {
  public execute(
    outputLinkManager:
      AZOutputLinkManager,
  ): readonly AZOutputCommand[] {
    const commands:
      AZOutputCommand[] = []

    const outputLinks = [
      ...outputLinkManager.getOutputLinks(),
    ]

    for (const outputLink of outputLinks) {
      switch (outputLink.status) {
        case 'NEW':
          commands.push({
            mode: 'ADDED',
            outputLink,
          })

          outputLinkManager.markProcessed(
            outputLink,
          )
          break

        case 'MODIFIED':
        case 'MODIFIED_BUT_SAME_TC':
          commands.push({
            mode: 'MODIFIED',
            outputLink,
          })

          outputLinkManager.markProcessed(
            outputLink,
          )
          break

        case 'REMOVED':
          commands.push({
            mode: 'REMOVED',
            outputLink,
          })

          outputLinkManager.removeProcessed(
            outputLink,
          )
          break

        case 'UNCHANGED':
          break
      }
    }

    return commands
  }
}
