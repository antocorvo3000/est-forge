import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import comuniData from "@/data/comuni.json";

interface Comune {
  nome: string;
  sigla: string;
  codice: string;
  cap: string[];
}

interface CityComboboxProps {
  value: string;
  onSelect: (city: string, province: string, cap: string) => void;
  placeholder?: string;
}

export function CityCombobox({ value, onSelect, placeholder = "Seleziona città..." }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const comuni = comuniData as Comune[];

  const filteredComuni = searchValue
    ? comuni.filter((comune) =>
        comune.nome.toLowerCase().includes(searchValue.toLowerCase())
      ).slice(0, 50) // Limit results for performance
    : comuni.slice(0, 50);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-white" align="start">
        <Command>
          <CommandInput
            placeholder="Cerca città..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="bg-white"
          />
          <CommandList>
            <CommandEmpty>Nessuna città trovata.</CommandEmpty>
            <CommandGroup>
              {filteredComuni.map((comune) => (
                <CommandItem
                  key={comune.codice}
                  value={comune.nome}
                  onSelect={() => {
                    const cap = comune.cap[0] || "";
                    onSelect(comune.nome, comune.sigla, cap);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === comune.nome ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {comune.nome} ({comune.sigla}) - CAP {comune.cap[0]}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
