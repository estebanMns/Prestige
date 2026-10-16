import { NotFoundError } from "../../../domain/shared/DomainError";
import type { PerfumeDTO, PerfumePresenter } from "../../dto/PerfumeDTO";
import type { PerfumeFilter, PerfumeRepository } from "../../ports/repositories";
import type { UseCase } from "../../ports/UseCase";

/** Lista el catálogo público con filtros opcionales; los destacados van primero. */
export class ListPerfumesUseCase implements UseCase<PerfumeFilter, PerfumeDTO[]> {
  constructor(
    private readonly perfumes: PerfumeRepository,
    private readonly presenter: PerfumePresenter,
  ) {}

  async execute(filter: PerfumeFilter = {}): Promise<PerfumeDTO[]> {
    const items = await this.perfumes.findAll(filter);
    items.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name, "es"));
    return this.presenter.toDTOs(items);
  }
}

export class GetPerfumeUseCase implements UseCase<{ id: string }, PerfumeDTO> {
  constructor(
    private readonly perfumes: PerfumeRepository,
    private readonly presenter: PerfumePresenter,
  ) {}

  async execute({ id }: { id: string }): Promise<PerfumeDTO> {
    const perfume = await this.perfumes.findById(id);
    if (!perfume) throw new NotFoundError("Perfume");
    return this.presenter.toDTO(perfume);
  }
}
