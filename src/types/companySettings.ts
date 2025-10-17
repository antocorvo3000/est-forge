export interface CompanySettings {
  name: string;
  vatNumber: string;
  address: string;
  phone: string;
  email: string;
  logoPath?: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: "ZetaForge S.r.l.",
  vatNumber: "01234567890",
  address: "Via Roma 1, Milano (MI)",
  phone: "+39 02 123456",
  email: "info@zetaforge.it",
  logoPath: undefined,
};
