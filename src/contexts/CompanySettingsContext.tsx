import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { CompanySettings } from "@/types/companySettings";
import { caricaDatiAzienda } from "@/lib/database";

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
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
};

interface CompanySettingsContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  reloadSettings: () => Promise<void>;
}

const CompanySettingsContext = createContext<CompanySettingsContextType | undefined>(undefined);

export const CompanySettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const datiAzienda = await caricaDatiAzienda();
      if (datiAzienda) {
        setSettings({
          name: datiAzienda.ragione_sociale,
          vatNumber: datiAzienda.partita_iva,
          address: datiAzienda.sede_legale,
          phone: datiAzienda.telefono,
          email: datiAzienda.email,
          logoPath: datiAzienda.logo_url,
          fontSizeList: datiAzienda.font_size_list ? parseFloat(String(datiAzienda.font_size_list)) : 1.0,
          fontSizeQuote: datiAzienda.font_size_quote ? parseFloat(String(datiAzienda.font_size_quote)) : 1.0,
          fontSizeClient: datiAzienda.font_size_client ? parseFloat(String(datiAzienda.font_size_client)) : 1.0,
          fontSizeSettings: datiAzienda.font_size_settings ? parseFloat(String(datiAzienda.font_size_settings)) : 1.0,
          fontSizeCustomQuote: datiAzienda.font_size_custom_quote ? parseFloat(String(datiAzienda.font_size_custom_quote)) : 1.0,
          fontSizeClone: datiAzienda.font_size_clone ? parseFloat(String(datiAzienda.font_size_clone)) : 1.0,
          fontSizeEditNumber: datiAzienda.font_size_edit_number ? parseFloat(String(datiAzienda.font_size_edit_number)) : 1.0,
          startingQuoteNumber: datiAzienda.numero_progressivo_iniziale || 1,
        });
      }
    } catch (error) {
      console.error("Errore nel caricamento dati azienda:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const reloadSettings = async () => {
    await loadSettings();
  };

  if (loading) {
    return null;
  }

  return (
    <CompanySettingsContext.Provider value={{ settings, updateSettings, reloadSettings }}>
      {children}
    </CompanySettingsContext.Provider>
  );
};

export const useCompanySettings = () => {
  const context = useContext(CompanySettingsContext);
  if (context === undefined) {
    throw new Error("useCompanySettings must be used within a CompanySettingsProvider");
  }
  return context;
};
