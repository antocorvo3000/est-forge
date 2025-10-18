import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CompanySettingsProvider } from "@/contexts/CompanySettingsContext";
import { NotificationProvider } from "@/components/NotificationManager";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import CreateQuote from "./pages/CreateQuote";
import ModifyQuote from "./pages/ModifyQuote";
import ClientDetails from "./pages/ClientDetails";
import CustomQuoteNumber from "./pages/CustomQuoteNumber";
import CloneQuote from "./pages/CloneQuote";
import EditQuoteNumber from "./pages/EditQuoteNumber";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CompanySettingsProvider>
        <NotificationProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/create-quote" element={<CreateQuote />} />
              <Route path="/modify-quote/:id" element={<ModifyQuote />} />
              <Route path="/client-details" element={<ClientDetails />} />
              <Route path="/custom-quote-number" element={<CustomQuoteNumber />} />
              <Route path="/clone-quote" element={<CloneQuote />} />
              <Route path="/edit-quote-number" element={<EditQuoteNumber />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </CompanySettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
