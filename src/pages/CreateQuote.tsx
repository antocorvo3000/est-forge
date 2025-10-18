import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CityCombobox } from "@/components/CityCombobox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useQuotes } from "@/hooks/useQuotes";
import { salvaCliente, salvaPreventivo, salvaRighePreventivo } from "@/lib/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import type { ClientData } from "./ClientDetails";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

interface QuoteLine {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const UNITS = [
  { value: "pz", label: "pz (pezzi)" },
  { value: "m", label: "m (metri)" },
  { value: "mq", label: "mq (metri quadri)" },
  { value: "mc", label: "mc (metri cubi)" },
  { value: "kg", label: "kg (chilogrammi)" },
  { value: "L", label: "L (litri)" },
  { value: "h", label: "h (ore)" },
  { value: "g", label: "g (grammi)" },
  { value: "cad", label: "cad (cadauno)" },
  { value: "a corpo", label: "a corpo (forfettario)" },
];

const CreateQuote = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useCompanySettings();
  const { addQuote } = useQuotes();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Client data from navigation state
  const [clientData, setClientData] = useState<ClientData | null>(
    location.state?.clientData || null
  );

  // Sync client data when returning from client details
  useEffect(() => {
    if (location.state?.clientData) {
      setClientData(location.state.clientData);
    }
  }, [location.state]);

  // Work location
  const [workAddress, setWorkAddress] = useState("");
  const [workCity, setWorkCity] = useState("");
  const [workProvince, setWorkProvince] = useState("");
  const [workZip, setWorkZip] = useState("");

  // Quote details
  const [subject, setSubject] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([
    { id: "1", description: "", unit: "pz", quantity: 0, unitPrice: 0, total: 0 }
  ]);

  // Discount
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const [showDiscountInTable, setShowDiscountInTable] = useState(false);

  // Notes
  const [notesEnabled, setNotesEnabled] = useState(false);
  const [notes, setNotes] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("da-concordare");
  const [customPayment, setCustomPayment] = useState("");

  // Dialogs
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const addLine = (afterIndex: number) => {
    const newLine: QuoteLine = {
      id: Date.now().toString(),
      description: "",
      unit: "pz",
      quantity: 0,
      unitPrice: 0,
      total: 0
    };
    const newLines = [...lines];
    newLines.splice(afterIndex + 1, 0, newLine);
    setLines(newLines);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof QuoteLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    if (field === "quantity" || field === "unitPrice") {
      newLines[index].total = newLines[index].quantity * newLines[index].unitPrice;
    }
    
    setLines(newLines);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number, field: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLine(index);
    }
  };

  // Calcola il prezzo unitario effettivo (con sconto applicato se necessario)
  const getEffectiveUnitPrice = (unitPrice: number) => {
    if (discountEnabled && !showDiscountInTable && discountValue > 0) {
      return unitPrice * (1 - discountValue / 100);
    }
    return unitPrice;
  };

  // Calcola il totale effettivo di una riga
  const getEffectiveLineTotal = (line: QuoteLine) => {
    return line.quantity * getEffectiveUnitPrice(line.unitPrice);
  };

  const calculateSubtotal = () => {
    if (discountEnabled && !showDiscountInTable) {
      // Se lo sconto è spalmato sui prezzi, il subtotale è già scontato
      return lines.reduce((sum, line) => sum + getEffectiveLineTotal(line), 0);
    }
    return lines.reduce((sum, line) => sum + line.total, 0);
  };

  const calculateDiscount = () => {
    if (!discountEnabled) return 0;
    // Lo sconto viene mostrato solo se showDiscountInTable è true
    if (showDiscountInTable) {
      return (lines.reduce((sum, line) => sum + line.total, 0) * discountValue) / 100;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return subtotal - discount;
  };

  const handleSave = () => {
    // Check if client data or work location are missing
    const missingClient = !clientData || !clientData.name.trim();
    const missingWork = !workAddress.trim() || !workCity.trim();
    
    if (missingClient || missingWork) {
      setShowSaveDialog(true);
      return;
    }
    
    saveQuote();
  };

  const saveQuote = async () => {
    try {
      // 1. Salva/aggiorna cliente
      let cliente_id = null;
      if (clientData && clientData.name) {
        const cliente = await salvaCliente({
          nome_ragione_sociale: clientData.name,
          codice_fiscale_piva: clientData.taxCode || null,
          via: clientData.address || null,
          citta: clientData.city || null,
          provincia: clientData.province || null,
          cap: clientData.zip || null,
          telefono: clientData.phone || null,
          email: clientData.email || null,
        });
        cliente_id = cliente.id;
      }

      // 2. Calcola totali
      const subtotale = calculateSubtotal();
      const sconto_percentuale = discountEnabled ? discountValue : 0;
      const sconto_valore = discountEnabled ? calculateDiscount() : 0;
      const totale = calculateTotal();

      // 3. Genera numero preventivo
      let newNum: number;
      let year: number;
      
      // Usa numero e anno personalizzati se presenti
      if (location.state?.customNumber && location.state?.customYear) {
        newNum = location.state.customNumber;
        year = location.state.customYear;
        
        // Controlla se esiste già
        const { data: existingQuote } = await supabase
          .from("preventivi")
          .select("numero")
          .eq("numero", newNum)
          .eq("anno", year)
          .single();
        
        if (existingQuote) {
          toast.error(
            `Il preventivo ${newNum.toString().padStart(2, '0')}-${year} esiste già. Eliminare quello esistente per continuare o modificarlo.`
          );
          return;
        }
      } else {
        // Altrimenti trova il primo numero disponibile
        year = new Date().getFullYear();
        const { data: existingQuotes } = await supabase
          .from("preventivi")
          .select("numero")
          .eq("anno", year)
          .order("numero", { ascending: true });
        
        const usedNumbers = existingQuotes?.map(q => q.numero) || [];
        
        // Se la numerazione personalizzata è attiva, parte dal numero impostato
        // Altrimenti parte da 1
        const baseNumber = settings.customNumberingEnabled ? settings.startingQuoteNumber : 1;
        
        // Trova il primo numero disponibile >= baseNumber
        newNum = baseNumber;
        for (const num of usedNumbers) {
          if (num >= baseNumber) {
            if (num === newNum) {
              newNum++;
            } else if (num > newNum) {
              break;
            }
          }
        }
      }

      // 4. Salva preventivo
      const preventivo = await salvaPreventivo({
        numero: newNum,
        anno: year,
        cliente_id,
        oggetto: subject,
        ubicazione_via: workAddress,
        ubicazione_citta: workCity,
        ubicazione_provincia: workProvince,
        ubicazione_cap: workZip,
        subtotale,
        sconto_percentuale,
        sconto_valore,
        totale,
        note: notesEnabled ? notes : null,
        modalita_pagamento: paymentMethod === "personalizzato" ? customPayment : paymentMethod,
      });

      // 5. Salva righe preventivo
      const righe = lines
        .filter(line => line.description.trim())
        .map(line => ({
          descrizione: line.description,
          unita_misura: line.unit,
          quantita: line.quantity,
          prezzo_unitario: line.unitPrice,
          totale: line.total,
        }));
      
      if (righe.length > 0) {
        await salvaRighePreventivo(preventivo.id, righe);
      }

      toast.success("Preventivo salvato con successo");
      navigate("/");
    } catch (error) {
      console.error("Errore salvataggio:", error);
      toast.error("Errore durante il salvataggio");
    }
  };

  const handleDelete = () => {
    toast.success("Preventivo eliminato");
    navigate("/");
  };

  const handleViewPdf = () => {
    toast.info("Funzionalità in sviluppo");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>
        {/* Header with back button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-3 sm:p-4 flex items-center gap-3 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">Nuovo Preventivo</h1>
        </motion.div>

        {/* Company and Client Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Company Info - Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-4">Dati Azienda</h2>
            <div className="space-y-2 text-sm">
              {settings.logoPath && (
                <div className="flex justify-center mb-3">
                  <img
                    src={settings.logoPath}
                    alt="Logo azienda"
                    className="max-h-24 w-auto object-contain"
                  />
                </div>
              )}
              <div className="font-semibold text-lg">{settings.name}</div>
              <div>P.IVA {settings.vatNumber}</div>
              <div>Sede legale: {settings.address}</div>
              <div>Tel. {settings.phone}</div>
              <div>Email: {settings.email}</div>
            </div>
          </motion.div>

          {/* Client Info - Right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-6 flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold">Dati Cliente</h2>
              <Button
                onClick={() => navigate("/client-details", { state: { clientData } })}
                size="sm"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Modifica
              </Button>
            </div>
            {clientData && clientData.name ? (
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-lg">{clientData.name}</div>
                {clientData.taxCode && <div>CF/P.IVA: {clientData.taxCode}</div>}
                {clientData.address && <div>{clientData.address}</div>}
                {(clientData.city || clientData.province || clientData.zip) && (
                  <div>
                    {clientData.zip} {clientData.city} {clientData.province && `(${clientData.province})`}
                  </div>
                )}
                {clientData.phone && <div>Tel. {clientData.phone}</div>}
                {clientData.email && <div>Email: {clientData.email}</div>}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                Nessun dato cliente inserito
              </div>
            )}
          </motion.div>
        </div>

        {/* Work Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold mb-4">Ubicazione del Lavoro</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workAddress" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Via</Label>
              <Input
                id="workAddress"
                value={workAddress}
                onChange={(e) => setWorkAddress(e.target.value)}
                placeholder="Via e numero civico"
                className="bg-white"
                style={{ fontSize: `${settings.fontSizeQuote}rem` }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workCity" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Città</Label>
              <CityCombobox
                value={workCity}
                onSelect={(city, province, cap) => {
                  setWorkCity(city);
                  setWorkProvince(province);
                  setWorkZip(cap);
                }}
                placeholder="Seleziona città..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workProvince" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Provincia</Label>
              <Input
                id="workProvince"
                value={workProvince}
                readOnly
                placeholder="PR"
                className="bg-muted cursor-not-allowed"
                style={{ fontSize: `${settings.fontSizeQuote}rem` }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workZip" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>CAP</Label>
              <Input
                id="workZip"
                value={workZip}
                readOnly
                placeholder="CAP"
                className="bg-muted cursor-not-allowed"
                style={{ fontSize: `${settings.fontSizeQuote}rem` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Subject */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="space-y-2">
            <Label htmlFor="subject" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Oggetto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Oggetto del preventivo"
              className="bg-white"
              style={{ fontSize: `${settings.fontSizeQuote}rem` }}
            />
          </div>
        </motion.div>

        {/* Quote Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold mb-4">Preventivo</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 w-8" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>#</th>
                  <th className="text-left p-2" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Descrizione</th>
                  <th className="text-left p-2 w-48" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>U.M.</th>
                  <th className="text-left p-2 w-24" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Qtà</th>
                  <th className="text-left p-2 w-32" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Prezzo Unit.</th>
                  <th className="text-left p-2 w-28" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Totale</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.id} className="border-b hover:bg-accent/20 transition-colors">
                    <td className="p-2 text-muted-foreground" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>{index + 1}</td>
                    <td className="p-2">
                      <Textarea
                        value={line.description}
                        onChange={(e) => updateLine(index, "description", e.target.value)}
                        placeholder="Descrizione"
                        className="min-w-[200px] bg-white resize-none min-h-[40px] overflow-hidden"
                        rows={1}
                        style={{ fontSize: `${settings.fontSizeQuote}rem` }}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                      />
                    </td>
                    <td className="p-2">
                      <Select
                        value={line.unit}
                        onValueChange={(value) => updateLine(index, "unit", value)}
                      >
                        <SelectTrigger className="bg-white text-left" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>
                          <SelectValue className="text-left" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {UNITS.map((unit) => (
                            <SelectItem 
                              key={unit.value} 
                              value={unit.value} 
                              className="text-left justify-start cursor-pointer"
                              style={{ fontSize: `${settings.fontSizeQuote}rem` }}
                            >
                              <span className="text-left w-full block">{unit.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={line.quantity || ""}
                        onChange={(e) => updateLine(index, "quantity", parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => handleKeyDown(e, index, "quantity")}
                        min="0"
                        step="0.01"
                        placeholder="0"
                        className="bg-white"
                        style={{ fontSize: `${settings.fontSizeQuote}rem` }}
                      />
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <Input
                          type="number"
                          value={line.unitPrice || ""}
                          onChange={(e) => updateLine(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          onKeyDown={(e) => handleKeyDown(e, index, "unitPrice")}
                          min="0"
                          step="0.01"
                          placeholder="0"
                          className="bg-white"
                          style={{ fontSize: `${settings.fontSizeQuote}rem` }}
                        />
                        {discountEnabled && !showDiscountInTable && discountValue > 0 && (
                          <div className="text-sm text-foreground font-medium">
                            <div>Scontato:</div>
                            <div>€ {formatCurrency(getEffectiveUnitPrice(line.unitPrice))}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 font-semibold" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>
                      € {formatCurrency(getEffectiveLineTotal(line))}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          onClick={() => addLine(index)}
                          className="h-8 w-8"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        {lines.length > 1 && (
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => removeLine(index)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="text-right space-y-2">
              <div className="text-lg font-semibold" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>
                Subtotale: € {formatCurrency(calculateSubtotal())}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Discount Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 mb-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Checkbox
              id="discountEnabled"
              checked={discountEnabled}
              onCheckedChange={(checked) => setDiscountEnabled(checked as boolean)}
            />
            <Label htmlFor="discountEnabled" className="cursor-pointer" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>
              Applica Sconto
            </Label>
          </div>

          {discountEnabled && (
            <div className="space-y-4 pl-6">
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="discountValue" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Valore Sconto (%)</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.01"
                  className="bg-white"
                  style={{ fontSize: `${settings.fontSizeQuote}rem` }}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="showDiscountInTable"
                  checked={showDiscountInTable}
                  onCheckedChange={(checked) => setShowDiscountInTable(checked as boolean)}
                />
                <Label htmlFor="showDiscountInTable" className="cursor-pointer" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>
                  Mostra sconto in tabella
                </Label>
              </div>

              <div className="text-sm text-muted-foreground" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>
                {showDiscountInTable
                  ? "Lo sconto verrà mostrato come riga separata"
                  : "Lo sconto verrà spalmato sui prezzi unitari"}
              </div>
            </div>
          )}
        </motion.div>

        {/* Notes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6 mb-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Checkbox
              id="notesEnabled"
              checked={notesEnabled}
              onCheckedChange={(checked) => setNotesEnabled(checked as boolean)}
            />
            <Label htmlFor="notesEnabled" className="cursor-pointer" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>
              Aggiungi Note
            </Label>
          </div>

          {notesEnabled && (
            <div className="pl-6">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Inserisci le note..."
                rows={4}
                className="bg-white"
                style={{ fontSize: `${settings.fontSizeQuote}rem` }}
              />
            </div>
          )}
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-6 mb-6 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Modalità di Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="bg-white" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="da-concordare" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Da concordare</SelectItem>
                <SelectItem value="bonifico" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Bonifico bancario</SelectItem>
                <SelectItem value="contanti" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Contanti</SelectItem>
                <SelectItem value="assegno" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Assegno</SelectItem>
                <SelectItem value="carta" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Carta di credito</SelectItem>
                <SelectItem value="personalizzato" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Personalizzato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === "personalizzato" && (
            <div className="space-y-2">
              <Label htmlFor="customPayment" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Modalità Personalizzata</Label>
              <Textarea
                id="customPayment"
                value={customPayment}
                onChange={(e) => setCustomPayment(e.target.value)}
                placeholder="Inserisci la modalità di pagamento personalizzata..."
                rows={3}
                className="bg-white"
                style={{ fontSize: `${settings.fontSizeQuote}rem` }}
              />
            </div>
          )}
        </motion.div>

        {/* Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="text-center">
            <div className="text-lg text-muted-foreground mb-2" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>Totale</div>
            <div className="text-4xl font-extrabold">
              € {formatCurrency(calculateTotal())}
            </div>
            {discountEnabled && (
              <div className="text-sm text-muted-foreground mt-2" style={{ fontSize: `${settings.fontSizeQuote}rem` }}>
                Sconto applicato: € {formatCurrency(calculateDiscount())}
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4 mb-6"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Button
              onClick={handleSave}
              size="lg"
              className="h-14 text-lg font-bold"
              style={{ fontSize: `${settings.fontSizeQuote}rem` }}
            >
              Salva
            </Button>
            <Button
              onClick={handleViewPdf}
              size="lg"
              className="h-14 text-lg font-bold"
              style={{ fontSize: `${settings.fontSizeQuote}rem` }}
            >
              Vedi il PDF
            </Button>
          </div>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            size="lg"
            className="h-14 text-lg font-bold w-full"
            style={{ fontSize: `${settings.fontSizeQuote}rem` }}
          >
            Elimina Preventivo
          </Button>
        </motion.div>

        {/* Save Confirmation Dialog */}
        <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-extrabold">Dati incompleti</AlertDialogTitle>
              <AlertDialogDescription className="text-lg font-semibold text-foreground">
                {!clientData?.name && !workAddress && (
                  <>Non hai inserito <span className="font-extrabold">i dati del cliente</span> né <span className="font-extrabold">l'ubicazione del lavoro</span>.</>
                )}
                {!clientData?.name && workAddress && (
                  <>Non hai inserito <span className="font-extrabold">i dati del cliente</span>.</>
                )}
                {clientData?.name && !workAddress && (
                  <>Non hai inserito <span className="font-extrabold">l'ubicazione del lavoro</span>.</>
                )}
                <div className="mt-3 text-lg">
                  Vuoi salvare comunque come <span className="font-extrabold">bozza</span>?
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-base font-bold">Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={saveQuote} className="text-base font-bold">
                Salva come Bozza
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare questo preventivo? Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CreateQuote;
