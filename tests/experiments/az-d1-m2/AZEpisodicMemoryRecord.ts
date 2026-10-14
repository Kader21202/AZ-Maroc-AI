import type {
  PersistentContinuationMemory,
} from '../../../src/engines/cognitive/az/monitoring/PersistentContinuationMemory'

export interface AZEpisodicMemoryRecord {
  readonly id: string
  readonly timestamp: string
  readonly context: string
  readonly action: string
  readonly outcome: string
  readonly memory: PersistentContinuationMemory
}
