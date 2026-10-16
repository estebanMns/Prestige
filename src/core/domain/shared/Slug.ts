export class Slug {
  private constructor(readonly value: string) {}

  static fromText(text: string): Slug {
    const value = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return new Slug(value || "perfume");
  }

  withSuffix(suffix: string): Slug {
    return new Slug(`${this.value}-${suffix}`);
  }

  toString(): string {
    return this.value;
  }
}
