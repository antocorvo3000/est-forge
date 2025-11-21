# 🚀 START HERE - Avvio Rapido

## ✨ Il File da Aprire

**FILE PRINCIPALE:**
```
📁 est-forge/EstForge.MAUI/EstForge.MAUI.sln
```

**Percorso assoluto:**
- **Linux/Mac**: `/home/user/est-forge/EstForge.MAUI/EstForge.MAUI.sln`
- **Windows**: `C:\Users\[TuoNome]\est-forge\EstForge.MAUI\EstForge.MAUI.sln`

---

## 🎯 3 Passi per Iniziare

### 1. Apri Visual Studio 2022
   - Versione minima: **17.8**
   - Workload richiesto: **.NET Multi-platform App UI development**

### 2. Apri il File Solution
   - **Doppio click** su `EstForge.MAUI.sln`
   - Oppure: File → Open → Project/Solution

### 3. Premi F5
   - L'app si compilerà e avvierà
   - Il database verrà creato automaticamente
   - Vedrai la finestra dell'applicazione!

---

## 📚 Documentazione Disponibile

| File | Scopo |
|------|-------|
| **VISUAL_STUDIO_SETUP.md** | Guida completa passo-passo per Visual Studio 2022 |
| **README.md** | Documentazione completa del progetto |
| **CONVERSION_NOTES.md** | Dettagli tecnici conversione React→MAUI |

---

## 🗂️ Struttura Progetto

```
EstForge.MAUI/
├── EstForge.MAUI.sln          ← QUESTO FILE!
├── START_HERE.md              ← Stai leggendo questo
├── VISUAL_STUDIO_SETUP.md     ← Leggi se hai problemi
├── README.md                  ← Documentazione completa
│
├── EstForge.MAUI/             ← App principale MAUI
│   ├── EstForge.MAUI.csproj
│   ├── App.xaml
│   ├── MainPage.xaml          ← Dashboard
│   ├── MauiProgram.cs         ← Configurazione app
│   ├── Views/
│   │   ├── CreateQuotePage.xaml
│   │   └── SettingsPage.xaml
│   └── Platforms/             ← Codice per ogni piattaforma
│
├── EstForge.Core/             ← Business logic
│   ├── ViewModels/            ← MVVM ViewModels
│   ├── Services/              ← Database, PDF
│   └── Helpers/               ← Formattazione italiana
│
└── EstForge.Data/             ← Database
    ├── Models/                ← Entità (Preventivo, Cliente, ecc)
    ├── Context/               ← Entity Framework DbContext
    └── Migrations/            ← Generato automaticamente
```

---

## ⚙️ Requisiti Sistema

### Windows (Raccomandato)
- ✅ Windows 10/11 (1809+)
- ✅ Visual Studio 2022 (17.8+)
- ✅ SQL Server LocalDB (incluso in VS)
- ✅ .NET 8.0 SDK

### macOS
- ✅ macOS 11+
- ✅ Visual Studio 2022 for Mac
- ✅ .NET 8.0 SDK
- ✅ Xcode 14+

---

## 🎯 Verifiche Prima di Iniziare

Prima di aprire, verifica:

- [ ] Visual Studio 2022 installato?
- [ ] Workload ".NET MAUI" installato?
- [ ] Hai il file `EstForge.MAUI.sln`?

### Come Verificare Workload MAUI

1. Apri **Visual Studio Installer**
2. Clicca **"Modify"** su Visual Studio 2022
3. Verifica che **".NET Multi-platform App UI development"** sia spuntato
4. Se no, spuntalo e clicca **"Modify"**

---

## 🔧 Primo Build

Una volta aperto in Visual Studio:

1. **Attendi** il ripristino automatico NuGet (~1-2 min)
2. **Build** → **Build Solution** (Ctrl+Shift+B)
3. **Attendi** completamento build (~1-3 min prima volta)
4. Verifica output:
   ```
   ========== Build: 3 succeeded, 0 failed ==========
   ```

---

## ▶️ Primo Avvio

1. Nella toolbar, assicurati che sia selezionato **"Windows Machine"**
2. Premi **F5** oppure clicca ▶️
3. L'app:
   - Si compilerà
   - Creerà il database SQL Server LocalDB
   - Inserirà dati di esempio (1 azienda + 5 clienti)
   - Si aprirà in una finestra Windows!

---

## 🎉 Cosa Fare Dopo l'Apertura

### Prima Configurazione

1. **Apri il menu laterale** (☰ in alto a sinistra)
2. **Vai su "Impostazioni"**
3. **Compila i dati aziendali**:
   - Ragione sociale
   - Partita IVA
   - Sede legale
   - Telefono
   - Email
4. **Salva**

### Crea il Primo Preventivo

1. **Torna alla Dashboard** (menu → Preventivi)
2. **Clicca "Nuovo"**
3. **Compila il form**:
   - Seleziona un cliente
   - Aggiungi oggetto lavori
   - Inserisci righe preventivo
   - Calcola totale
4. **Salva**

---

## 🐛 Problemi Comuni

### "Project needs to be restored"
→ Tasto destro sulla solution → "Restore NuGet Packages"

### "Windows SDK not found"
→ Visual Studio Installer → Modify → Individual Components → Windows 10 SDK

### "Cannot connect to database"
→ CMD: `sqllocaldb start mssqllocaldb`

### Build fallisce
→ Build → Clean Solution → Rebuild Solution

---

## 📊 Cosa Include il Progetto

- ✅ **61 file totali**
- ✅ **3 progetti** (MAUI, Core, Data)
- ✅ **37 pacchetti NuGet**
- ✅ **5 piattaforme** (Windows, Android, iOS, Mac, Tizen)
- ✅ **Database SQL Server** con Entity Framework
- ✅ **Generazione PDF** professionale
- ✅ **Auto-save** ogni 2 secondi
- ✅ **Design iOS-inspired**
- ✅ **Formattazione italiana** completa

---

## 📞 Serve Aiuto?

### Leggi nell'Ordine:

1. **VISUAL_STUDIO_SETUP.md** → Guida passo-passo completa
2. **README.md** → Documentazione tecnica completa
3. **CONVERSION_NOTES.md** → Dettagli conversione React→MAUI

### Documenti per Argomento:

| Argomento | File |
|-----------|------|
| Setup iniziale | VISUAL_STUDIO_SETUP.md |
| Funzionalità | README.md |
| Struttura database | README.md (sezione Database) |
| Deployment | README.md (sezione Deployment) |
| Troubleshooting | VISUAL_STUDIO_SETUP.md |
| Differenze React | CONVERSION_NOTES.md |

---

## ✅ Quick Check

**Il progetto è pronto se:**
- ✓ Vedi 3 progetti nella Solution Explorer
- ✓ Build completa con successo (3/3)
- ✓ F5 apre l'app in una finestra Windows
- ✓ Vedi la Dashboard con menu laterale
- ✓ Puoi aprire le Impostazioni
- ✓ Puoi cliccare "Nuovo" per creare preventivo

---

## 🎯 File Più Importanti da Esplorare

### UI (XAML)
- `EstForge.MAUI/MainPage.xaml` → Dashboard preventivi
- `EstForge.MAUI/Views/CreateQuotePage.xaml` → Form creazione
- `EstForge.MAUI/AppShell.xaml` → Menu laterale
- `EstForge.MAUI/App.xaml` → Stili globali

### Logic (C#)
- `EstForge.Core/ViewModels/MainViewModel.cs` → Logica dashboard
- `EstForge.Core/Services/DatabaseService.cs` → Operazioni DB
- `EstForge.Core/Services/PdfGeneratorService.cs` → PDF
- `EstForge.MAUI/MauiProgram.cs` → Configurazione app

### Database
- `EstForge.Data/Context/EstForgeDbContext.cs` → Schema DB
- `EstForge.Data/Models/Preventivo.cs` → Modello preventivo
- `EstForge.Data/Models/Cliente.cs` → Modello cliente

---

**Versione**: 1.0
**Stato**: ✅ Completo e Funzionante
**Ultimo aggiornamento**: Novembre 2025

---

# 🎊 Sei Pronto!

**Apri semplicemente `EstForge.MAUI.sln` in Visual Studio 2022 e premi F5!**

In caso di dubbi, leggi **VISUAL_STUDIO_SETUP.md** per la guida passo-passo completa.

---

Buon lavoro! 🚀
