import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useCompanySettings();
  const [formData, setFormData] = useState(settings);

  const handleSave = () => {
    updateSettings(formData);
    toast.success("Impostazioni salvate con successo");
    navigate("/");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoPath: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-16 space-y-3 sm:space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-3 sm:p-4 flex items-center gap-3 mx-4 sm:mx-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Impostazioni
          </h1>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mx-4 sm:mx-6 space-y-6"
        >
          <div>
            <h2 className="text-xl font-bold mb-4">Logo Aziendale</h2>
            <div className="flex items-center gap-4">
              {formData.logoPath ? (
                <div className="flex items-center gap-4">
                  <img
                    src={formData.logoPath}
                    alt="Logo aziendale"
                    className="max-h-36 w-auto object-contain rounded-lg border border-border bg-white p-2"
                  />
                </div>
              ) : (
                <div className="max-h-36 w-32 rounded-lg border border-border bg-white flex items-center justify-center text-muted-foreground p-2">
                  Logo
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="logo-upload"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all h-10"
                >
                  <Upload className="w-4 h-4" />
                  Carica Logo
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                {formData.logoPath && (
                  <Button
                    onClick={() => setFormData({ ...formData, logoPath: undefined })}
                    variant="destructive"
                    className="gap-2 h-10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Elimina Logo
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Dati Aziendali</h2>
            
            <div className="space-y-2">
              <Label htmlFor="name">Ragione Sociale</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatNumber">Partita IVA</Label>
              <Input
                id="vatNumber"
                value={formData.vatNumber}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Sede Legale</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              Annulla
            </Button>
            <Button onClick={handleSave}>
              Salva Modifiche
            </Button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Settings;
