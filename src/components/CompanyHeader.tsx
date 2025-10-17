import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";

export const CompanyHeader = () => {
  const { settings } = useCompanySettings();

  return (
    <>
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight text-white mx-auto w-fit"
        style={{ 
          WebkitTextStroke: '4px black',
          paintOrder: 'stroke fill'
        }}
      >
        Gestione Preventivi
      </motion.h1>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center py-2 sm:py-3"
      >
        <div className="w-16 h-16 rounded-2xl bg-white border border-border shadow-lg flex items-center justify-center overflow-hidden">
          {settings.logoPath ? (
            <img src={settings.logoPath} alt="Logo aziendale" className="w-full h-full object-contain p-2" />
          ) : (
            <FileText className="w-9 h-9 text-foreground/80" strokeWidth={1.8} />
          )}
        </div>
      </motion.div>

      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl mx-4 sm:mx-6 mb-2 sm:mb-3 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {settings.name}
          </h2>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground text-left sm:text-right space-y-0.5">
          <div>P.IVA {settings.vatNumber}</div>
          <div>Sede legale: {settings.address}</div>
          <div>Tel. {settings.phone} • email: {settings.email}</div>
        </div>
      </motion.header>
    </>
  );
};
