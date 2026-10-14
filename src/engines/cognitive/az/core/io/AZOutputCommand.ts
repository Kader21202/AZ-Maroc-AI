import type { AZOutputCommandMode } from './AZOutputCommandMode'
import type { AZOutputLink } from './AZOutputLink'

export interface AZOutputCommand {
  readonly mode: AZOutputCommandMode
  readonly outputLink: AZOutputLink
}
