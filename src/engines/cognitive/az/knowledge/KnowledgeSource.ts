export interface KnowledgeSource {
  lookup(
    question: string,
  ): string | null
}
