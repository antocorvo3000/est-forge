export interface CompanySettings {
  name: string;
  vatNumber: string;
  address: string;
  phone: string;
  email: string;
  logoPath?: string;
  fontSizeList: number;
  fontSizeQuote: number;
  fontSizeClient: number;
  fontSizeSettings: number;
  fontSizeCustomQuote: number;
  fontSizeClone: number;
  fontSizeEditNumber: number;
  startingQuoteNumber: number;
  customNumberingEnabled: boolean;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: "ZetaForge S.r.l.",
  vatNumber: "01234567890",
  address: "Via Roma 1, Milano (MI)",
  phone: "+39 02 123456",
  email: "info@zetaforge.it",
  logoPath: undefined,
  fontSizeList: 1.0,
  fontSizeQuote: 1.0,
  fontSizeClient: 1.0,
  fontSizeSettings: 1.0,
  fontSizeCustomQuote: 1.0,
  fontSizeClone: 1.0,
  fontSizeEditNumber: 1.0,
  startingQuoteNumber: 1,
  customNumberingEnabled: false,
};
