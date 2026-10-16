/** Contrato común de los casos de uso: una sola operación de negocio por clase. */
export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
