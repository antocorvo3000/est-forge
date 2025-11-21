# EST-FORGE MAUI

Sistema di gestione preventivi professionale sviluppato in .NET MAUI con SQL Server.

Conversione completa da React/TypeScript/Supabase a C#/MAUI/SQL Server.

## 📋 Caratteristiche

### ✅ Funzionalità Complete

- **Gestione Preventivi**: Crea, modifica, clona ed elimina preventivi
- **Dashboard Real-time**: Lista preventivi con ricerca e filtri
- **Anagrafica Clienti**: Gestione completa dei clienti
- **Generazione PDF**: PDF professionali con QuestPDF
- **Auto-save**: Salvataggio automatico ogni 2 secondi
- **Impostazioni Azienda**: Configurazione completa (logo, font size, numerazione)
- **Formattazione Italiana**: Numeri, valute e date in formato italiano
- **Design iOS-inspired**: Interfaccia moderna con animazioni fluide
- **Multi-platform**: Windows, macOS, iOS, Android

### 🏗️ Architettura

- **MVVM Pattern**: Separazione pulita View/ViewModel/Model
- **Entity Framework Core**: ORM per SQL Server
- **Dependency Injection**: Gestione servizi centralizzata
- **CommunityToolkit.Mvvm**: Command e proprietà osservabili
- **Repository Pattern**: Astrazione accesso dati

## 🚀 Requisiti di Sistema

### Windows

- **Windows 10/11** (versione 1809 o superiore)
- **Visual Studio 2022** (17.8 o superiore)
  - Workload ".NET Multi-platform App UI development"
  - Workload "ASP.NET and web development"
- **.NET 8.0 SDK** o superiore
- **SQL Server LocalDB** (incluso in Visual Studio)
  - Oppure SQL Server Express/Developer/Standard

### macOS

- **macOS 11 (Big Sur)** o superiore
- **Visual Studio 2022 for Mac** (17.6 o superiore)
- **.NET 8.0 SDK**
- **Xcode 14** o superiore
- **SQL Server** (remoto o Docker)

### Linux

- **.NET 8.0 SDK**
- **SQL Server** (remoto o Docker)
- Supporto limitato a sviluppo backend

## 📦 Installazione

### 1. Clonare il Repository

```bash
cd EstForge.MAUI
```

### 2. Installare Dipendenze

Le dipendenze vengono installate automaticamente da NuGet al primo build:

- Microsoft.EntityFrameworkCore.SqlServer (8.0.11)
- Microsoft.EntityFrameworkCore.Tools (8.0.11)
- Microsoft.Maui.Controls (8.0.91)
- CommunityToolkit.Maui (9.1.0)
- CommunityToolkit.Mvvm (8.3.2)
- QuestPDF (2024.10.3)

### 3. Configurare Database

#### Opzione A: SQL Server LocalDB (Windows - Raccomandato)

LocalDB è incluso in Visual Studio. La stringa di connessione di default funziona automaticamente:

```csharp
Server=(localdb)\mssqllocaldb;Database=EstForgeDb;Trusted_Connection=True;
```

#### Opzione B: SQL Server Express/Developer

1. Installa SQL Server Express: https://www.microsoft.com/sql-server/sql-server-downloads
2. Modifica la connection string in `MauiProgram.cs`:

```csharp
Server=localhost;Database=EstForgeDb;Trusted_Connection=True;
```

#### Opzione C: SQL Server con Autenticazione

```csharp
Server=your-server;Database=EstForgeDb;User Id=sa;Password=YourPassword;
```

### 4. Applicare Migrazioni

Le migrazioni vengono applicate automaticamente all'avvio dell'app tramite:

```csharp
await dbService.InitializeDatabaseAsync();
```

Per applicarle manualmente:

```bash
cd EstForge.Data
dotnet ef database update
```

### 5. Build e Run

#### Visual Studio (Windows/Mac)

1. Apri `EstForge.MAUI.sln`
2. Seleziona il progetto di startup: `EstForge.MAUI`
3. Seleziona la piattaforma target:
   - **Windows Machine** (per Windows)
   - **iOS Simulator** (per iOS)
   - **Android Emulator** (per Android)
4. Premi F5 o "Start Debugging"

#### CLI

```bash
# Windows
dotnet build EstForge.MAUI/EstForge.MAUI.csproj -f net8.0-windows10.0.19041.0
dotnet run --project EstForge.MAUI/EstForge.MAUI.csproj -f net8.0-windows10.0.19041.0

# Android
dotnet build EstForge.MAUI/EstForge.MAUI.csproj -f net8.0-android
dotnet run --project EstForge.MAUI/EstForge.MAUI.csproj -f net8.0-android

# iOS (solo su macOS)
dotnet build EstForge.MAUI/EstForge.MAUI.csproj -f net8.0-ios
```

## 🗄️ Struttura Database

### Tabelle Principali

#### **Azienda** (Configurazione)
- Ragione sociale, P.IVA, sede legale
- Logo URL, font sizes per pagina
- Numerazione progressiva personalizzata

#### **Clienti**
- Anagrafica completa
- Indirizzo, contatti
- CF/P.IVA

#### **Preventivi**
- Numero/Anno univoco
- Cliente (FK nullable)
- Oggetto, ubicazione lavori
- Totali, sconti
- Note, modalità pagamento

#### **RighePreventivo**
- Preventivo (FK, CASCADE DELETE)
- Descrizione, unità di misura
- Quantità, prezzo unitario, totale

#### **PreventiviCache**
- Auto-save temporaneo
- JSON per righe e dati cliente
- Tipo operazione (creazione/modifica/clone)

### Seed Data

All'inizializzazione vengono inseriti:
- 1 azienda di default (ZetaForge S.r.l.)
- 5 clienti di esempio
- 0 preventivi (vengono creati dall'utente)

## 📁 Struttura Progetto

```
EstForge.MAUI/
├── EstForge.MAUI/              # Progetto MAUI principale
│   ├── Views/                  # Pagine XAML
│   │   ├── MainPage.xaml       # Dashboard preventivi
│   │   ├── CreateQuotePage.xaml # Creazione preventivo
│   │   └── SettingsPage.xaml   # Impostazioni
│   ├── Resources/              # Risorse (font, immagini, stili)
│   │   └── Styles/
│   │       ├── Colors.xaml     # Palette colori
│   │       └── Styles.xaml     # Stili globali
│   ├── App.xaml                # Applicazione root
│   ├── AppShell.xaml           # Shell navigation
│   └── MauiProgram.cs          # Configurazione DI
│
├── EstForge.Core/              # Logica business
│   ├── ViewModels/             # ViewModels MVVM
│   │   ├── BaseViewModel.cs
│   │   ├── MainViewModel.cs
│   │   ├── CreateQuoteViewModel.cs
│   │   └── SettingsViewModel.cs
│   ├── Services/               # Servizi applicazione
│   │   ├── IDatabaseService.cs
│   │   ├── DatabaseService.cs
│   │   ├── IPdfGeneratorService.cs
│   │   └── PdfGeneratorService.cs
│   └── Helpers/
│       └── ItalianFormatHelper.cs
│
└── EstForge.Data/              # Accesso dati
    ├── Models/                 # Entità EF Core
    │   ├── Azienda.cs
    │   ├── Cliente.cs
    │   ├── Preventivo.cs
    │   ├── RigaPreventivo.cs
    │   └── PreventivoCache.cs
    ├── Context/
    │   └── EstForgeDbContext.cs
    └── Migrations/             # Migrazioni EF Core
```

## 🎨 Design System

### Colori (iOS-inspired)

- **Primary**: `#007AFF` (iOS Blue)
- **Success**: `#34C759` (iOS Green)
- **Error**: `#FF3B30` (iOS Red)
- **Warning**: `#FF9500` (iOS Orange)
- **Gray Scale**: Da `#F2F2F7` a `#3A3A3C`

### Tipografia

- **Windows**: Segoe UI
- **iOS**: San Francisco (default)
- **Android**: Roboto (default)

### Componenti

- Card con border-radius 15px
- Buttons con corner-radius 10px
- Shadow per elevazione (iOS-style)
- Smooth animations con CommunityToolkit

## 🔧 Configurazione Avanzata

### Cambio Connection String

In `EstForge.MAUI/MauiProgram.cs`:

```csharp
private static string GetConnectionString()
{
    // Personalizza qui la tua connection string
    return @"Server=YourServer;Database=EstForgeDb;User Id=sa;Password=YourPassword;";
}
```

### Licenza QuestPDF

QuestPDF è gratuito per uso non commerciale. Per uso commerciale:

```csharp
QuestPDF.Settings.License = LicenseType.Professional;
```

Acquista licenza su: https://www.questpdf.com/pricing.html

### Font Size Personalizzati

Vai su **Impostazioni** → **Dimensioni Font per Pagina**

Regola da 0.8 (più piccolo) a 1.5 (più grande)

### Numerazione Preventivi

**Automatica** (default): Parte da 1 ogni anno

**Personalizzata**:
1. Vai su Impostazioni
2. Attiva "Usa numerazione personalizzata"
3. Imposta numero iniziale (es: 1000)

## 📱 Deployment

### Windows (MSIX)

```bash
dotnet publish EstForge.MAUI/EstForge.MAUI.csproj -f net8.0-windows10.0.19041.0 -c Release
```

L'app verrà pacchettizzata in formato MSIX per Microsoft Store o sideload.

### Android (APK/AAB)

```bash
dotnet publish EstForge.MAUI/EstForge.MAUI.csproj -f net8.0-android -c Release
```

Per pubblicare su Google Play Store:

```bash
dotnet publish -f net8.0-android -c Release -p:AndroidKeyStore=true -p:AndroidSigningKeyStore=myapp.keystore
```

### iOS (App Store)

1. Configura provisioning profile in Xcode
2. Build con configurazione Release
3. Archive tramite Xcode
4. Upload su App Store Connect

### macOS

```bash
dotnet publish EstForge.MAUI/EstForge.MAUI.csproj -f net8.0-maccatalyst -c Release
```

## 🐛 Troubleshooting

### Errore: "Cannot connect to database"

**Soluzione**: Verifica che SQL Server sia in esecuzione:

```bash
# Verifica servizio SQL Server
sc query MSSQL$SQLEXPRESS

# Oppure LocalDB
sqllocaldb info
sqllocaldb start mssqllocaldb
```

### Errore: "Migration failed"

**Soluzione**: Elimina database e ricrea:

```bash
dotnet ef database drop --project EstForge.Data
dotnet ef database update --project EstForge.Data
```

### App non si avvia su Android

**Soluzione**: Verifica API Level minimo (21) e permessi in `AndroidManifest.xml`

### PDF non viene generato

**Soluzione**: Verifica licenza QuestPDF e permessi scrittura file

```csharp
// Aggiungi permessi storage in AndroidManifest.xml
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Font troppo piccoli/grandi

**Soluzione**: Vai su Impostazioni → Dimensioni Font e regola per ogni pagina

## 📊 Differenze con Versione React

| Feature | React/Supabase | MAUI/SQL Server |
|---------|----------------|-----------------|
| **Framework** | React 18 + TypeScript | .NET 8 MAUI + C# |
| **Database** | PostgreSQL (Supabase) | SQL Server LocalDB |
| **Storage** | Supabase Storage | File system locale |
| **PDF** | jsPDF | QuestPDF |
| **State** | React Query + Context | MVVM + EF Core |
| **Styling** | Tailwind CSS | XAML Styles |
| **Real-time** | Supabase Subscriptions | Polling / SignalR (opzionale) |
| **Platform** | Web (browser) | Windows/Mac/iOS/Android |

### Funzionalità Identiche Mantenute

✅ Dashboard preventivi con ricerca
✅ Creazione/modifica preventivi
✅ Gestione clienti
✅ Generazione PDF professionale
✅ Auto-save ogni 2 secondi
✅ Impostazioni azienda complete
✅ Numerazione personalizzata
✅ Font size per pagina
✅ Formattazione italiana
✅ Design iOS-inspired

### Animazioni MAUI vs React

Le animazioni Framer Motion sono state convertite in:
- `CommunityToolkit.Maui` animations
- XAML `VisualStateManager`
- Codice C# per animazioni custom

## 🔐 Sicurezza

### Database

- **Nessuna autenticazione** implementata (come nella versione React)
- Per produzione: implementare Identity Server / Azure AD B2C
- Row Level Security non necessaria (app desktop locale)

### Best Practices

1. **Backup regolari** del database SQL Server
2. **Crittografia** della connection string in produzione
3. **Validazione input** lato client E server
4. **Sanitizzazione** query SQL (già gestita da EF Core)

## 📖 Prossimi Passi

### Features da Implementare

- [ ] **Real-time sync** con SignalR
- [ ] **Export Excel** preventivi
- [ ] **Email PDF** direttamente dall'app
- [ ] **Backup/Restore** database integrato
- [ ] **Temi** (Light/Dark mode)
- [ ] **Multilingua** (IT/EN)
- [ ] **Reportistica** avanzata con grafici
- [ ] **Integrazione contabilità** (Fatture in Cloud, Aruba)
- [ ] **App mobile** ottimizzata

### Miglioramenti Tecnici

- [ ] **Unit Tests** con xUnit
- [ ] **CI/CD** con GitHub Actions
- [ ] **Docker** support per SQL Server
- [ ] **Cloud sync** con Azure SQL
- [ ] **Offline-first** con SQLite + sync

## 📄 Licenza

© 2025 ZetaForge S.r.l. - Tutti i diritti riservati

Questo è un progetto privato per uso interno aziendale.

## 🤝 Supporto

Per domande o problemi:
- **Email**: info@zetaforge.it
- **Telefono**: +39 02 123456

---

**Versione**: 1.0.0
**Data**: Novembre 2025
**Autore**: Convertito da React/Supabase a MAUI/SQL Server
