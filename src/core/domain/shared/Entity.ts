/**
 * Base de todas las entidades: se identifican por su id, no por sus atributos.
 * Las propiedades son privadas para que el estado solo cambie a través de métodos de negocio.
 */
export abstract class Entity<TProps extends object> {
  protected constructor(
    readonly id: string,
    protected props: TProps,
  ) {}

  equals(other: Entity<TProps>): boolean {
    return other instanceof Entity && other.id === this.id;
  }
}
