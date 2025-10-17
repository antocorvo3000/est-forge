import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export const CompanyHeader = () => {
  return (
    <>
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight px-4 pt-3 sm:pt-5 pb-0 drop-shadow-sm"
      >
        Gestione Preventivi
      </motion.h1>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center py-2 sm:py-3"
      >
        <div className="w-16 h-16 rounded-2xl bg-white border border-border shadow-lg flex items-center justify-center">
          <FileText className="w-9 h-9 text-foreground/80" strokeWidth={1.8} />
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
            ZetaForge S.r.l.
          </h2>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground text-left sm:text-right space-y-0.5">
          <div>P.IVA 01234567890</div>
          <div>Sede legale: Via Roma 1, Milano (MI)</div>
          <div>Tel. +39 02 123456 • email: info@zetaforge.it</div>
        </div>
      </motion.header>
    </>
  );
};
