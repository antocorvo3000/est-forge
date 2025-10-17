import { Search } from "lucide-react";
import { motion } from "framer-motion";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl border border-border shadow-sm focus-within:shadow-md transition-shadow"
    >
      <Search className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.6} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cerca preventivo, cliente o #ID…"
        className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
      />
    </motion.div>
  );
};
