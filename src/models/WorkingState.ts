export interface WorkingState<TSituation = unknown> {
  situation: TSituation
  goals: unknown[]
  activeAction: unknown | null
  intermediateResults: unknown[]
}
