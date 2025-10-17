import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CityCombobox } from "@/components/CityCombobox";

export interface ClientData {
  name: string;
  taxCode: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  phone: string;
  email: string;
}

const ClientDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingData = location.state?.clientData as ClientData | undefined;

  const [clientName, setClientName] = useState(existingData?.name || "");
  const [clientTaxCode, setClientTaxCode] = useState(existingData?.taxCode || "");
  const [clientAddress, setClientAddress] = useState(existingData?.address || "");
  const [clientCity, setClientCity] = useState(existingData?.city || "");
  const [clientProvince, setClientProvince] = useState(existingData?.province || "");
  const [clientZip, setClientZip] = useState(existingData?.zip || "");
  const [clientPhone, setClientPhone] = useState(existingData?.phone || "");
  const [clientEmail, setClientEmail] = useState(existingData?.email || "");

  const handleSave = () => {
    const clientData: ClientData = {
      name: clientName,
      taxCode: clientTaxCode,
      address: clientAddress,
      city: clientCity,
      province: clientProvince,
      zip: clientZip,
      phone: clientPhone,
      email: clientEmail,
    };
    
    const returnTo = location.state?.returnTo || "/create-quote";
    const quote = location.state?.quote;
    
    navigate(returnTo, { state: { clientData, quote } });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Header with back button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/create-quote")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">Dati Cliente</h1>
        </motion.div>

        {/* Client Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="clientName">Nome/Ragione Sociale</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Inserisci nome o ragione sociale"
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientTaxCode">Codice Fiscale / P.IVA</Label>
            <Input
              id="clientTaxCode"
              value={clientTaxCode}
              onChange={(e) => setClientTaxCode(e.target.value)}
              placeholder="Inserisci CF o P.IVA"
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientAddress">Via</Label>
            <Input
              id="clientAddress"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Via e numero civico"
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientCity">Città</Label>
            <CityCombobox
              value={clientCity}
              onSelect={(city, province, cap) => {
                setClientCity(city);
                setClientProvince(province);
                setClientZip(cap);
              }}
              placeholder="Seleziona città..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="clientProvince">Provincia</Label>
              <Input
                id="clientProvince"
                value={clientProvince}
                readOnly
                placeholder="PR"
                className="bg-muted cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientZip">CAP</Label>
              <Input
                id="clientZip"
                value={clientZip}
                readOnly
                placeholder="CAP"
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientPhone">Telefono</Label>
            <Input
              id="clientPhone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Numero di telefono"
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Email"
              className="bg-white"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSave}
              size="lg"
              className="w-full h-14 text-lg font-bold"
            >
              Salva
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientDetails;
