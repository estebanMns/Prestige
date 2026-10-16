import { Email } from "../shared/Email";
import { PhoneNumber } from "../shared/PhoneNumber";
import { ValidationError } from "../shared/DomainError";

export interface StoreSettingsProps {
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  about: string;
}

/** Datos de contacto y presentación de la tienda (pie de página y destino de los pedidos). */
export class StoreSettings {
  private constructor(private readonly props: StoreSettingsProps) {}

  static empty(): StoreSettings {
    return new StoreSettings({ whatsapp: "", email: "", address: "", hours: "", instagram: "", tiktok: "", facebook: "", about: "" });
  }

  static restore(props: StoreSettingsProps): StoreSettings {
    return new StoreSettings(props);
  }

  static create(input: StoreSettingsProps): StoreSettings {
    return new StoreSettings({
      whatsapp: input.whatsapp.trim() ? PhoneNumber.create(input.whatsapp, "whatsapp").digits : "",
      email: input.email.trim() ? Email.create(input.email).value : "",
      address: input.address.trim().slice(0, 200),
      hours: input.hours.trim().slice(0, 120),
      instagram: StoreSettings.socialUrl(input.instagram, "instagram"),
      tiktok: StoreSettings.socialUrl(input.tiktok, "tiktok"),
      facebook: StoreSettings.socialUrl(input.facebook, "facebook"),
      about: input.about.trim().slice(0, 1500),
    });
  }

  private static socialUrl(raw: string, field: string): string {
    const value = raw.trim();
    if (!value) return "";
    const url = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^@/, "")}`;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") throw new Error();
      return parsed.toString();
    } catch {
      throw new ValidationError("El enlace de la red social no es válido.", field);
    }
  }

  toJSON(): StoreSettingsProps {
    return { ...this.props };
  }

  get whatsapp(): string {
    return this.props.whatsapp;
  }
}
