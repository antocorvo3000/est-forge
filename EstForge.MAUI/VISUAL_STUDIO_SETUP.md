# Guida Apertura Progetto in Visual Studio 2022

## 🎯 File da Aprire

**Percorso completo del file solution:**
```
/home/user/est-forge/EstForge.MAUI/EstForge.MAUI.sln
```

Oppure su Windows:
```
C:\Users\[TuoNome]\est-forge\EstForge.MAUI\EstForge.MAUI.sln
```

---

## 📋 Checklist Pre-Apertura

Prima di aprire il progetto, verifica di avere:

- [ ] **Visual Studio 2022** (versione 17.8 o superiore)
- [ ] **Workload ".NET Multi-platform App UI development"** installato
- [ ] **SQL Server LocalDB** (incluso in Visual Studio) oppure SQL Server Express

### Verifica Workload MAUI

1. Apri **Visual Studio Installer**
2. Clicca **"Modify"** su Visual Studio 2022
3. Nella scheda **"Workloads"**, assicurati che sia selezionato:
   - ✅ **.NET Multi-platform App UI development**
4. Se mancante, selezionalo e clicca **"Modify"**

---

## 🚀 Passi per Apertura

### Passo 1: Aprire la Solution

**Metodo A - Doppio Click (Più Veloce)**
1. Vai alla cartella `est-forge/EstForge.MAUI/`
2. **Doppio click** su `EstForge.MAUI.sln`
3. Visual Studio si aprirà automaticamente

**Metodo B - Da Visual Studio**
1. Apri **Visual Studio 2022**
2. Clicca **"Open a project or solution"**
3. Naviga a `est-forge/EstForge.MAUI/EstForge.MAUI.sln`
4. Clicca **"Open"**

### Passo 2: Attendi Caricamento

Visual Studio caricherà:
- ✓ 3 progetti (EstForge.MAUI, EstForge.Core, EstForge.Data)
- ✓ Ripristino automatico pacchetti NuGet (~1-2 minuti)

**Nella finestra Output** vedrai:
```
Restoring NuGet packages...
Package restore finished.
```

### Passo 3: Impostare Progetto di Startup

1. Nella **Solution Explorer** (pannello di destra)
2. Trova **"EstForge.MAUI"** (il progetto principale)
3. **Tasto destro** → **"Set as Startup Project"**
4. Il progetto diventerà **in grassetto**

### Passo 4: Selezionare Piattaforma

Nella **toolbar** in alto (accanto al pulsante ▶️ verde):

1. Clicca sul dropdown della piattaforma
2. Seleziona: **"Windows Machine"**

Dovresti vedere:
```
▶️ Windows Machine | x64 | Debug
```

---

## 🔨 Primo Build

### Build della Solution

1. Menu: **Build** → **Build Solution**
   - Oppure premi **Ctrl+Shift+B**

2. Attendi completamento (~1-3 minuti la prima volta)

3. Verifica nella finestra **Output**:
```
========== Build: 3 succeeded, 0 failed, 0 up-to-date, 0 skipped ==========
========== Build started at 14:30 and took 01:45.123 minutes ==========
```

---

## ▶️ Eseguire l'Applicazione

### Avvia in Debug

1. Premi **F5**
   - Oppure clicca il pulsante ▶️ verde **"Windows Machine"**

### Cosa Succede al Primo Avvio

1. ⚙️ **Compilazione** (~30-60 secondi)
2. 🗄️ **Creazione database** SQL Server LocalDB automatica
3. 📊 **Applicazione migration** Entity Framework
4. 🌱 **Seed data** (1 azienda + 5 clienti)
5. 🎉 **App si apre** in una finestra Windows!

---

## 🗄️ Verifica Database

Il database viene creato automaticamente in SQL Server LocalDB.

### Visualizzare il Database in Visual Studio

1. Menu: **View** → **SQL Server Object Explorer**
2. Espandi:
   ```
   SQL Server
     └─ (localdb)\MSSQLLocalDB
        └─ Databases
           └─ EstForgeDb ← Il tuo database!
              ├─ Tables
              │  ├─ Azienda
              │  ├─ Clienti
              │  ├─ Preventivi
              │  ├─ RighePreventivo
              │  └─ PreventiviCache
              └─ ...
   ```

3. **Tasto destro** su una tabella → **"View Data"** per vedere i dati

---

## 📁 Struttura Solution Explorer

Dopo l'apertura vedrai:

```
📁 Solution 'EstForge.MAUI' (3 of 3 projects)
│
├─ 📁 EstForge.MAUI ⭐ (Startup Project - in grassetto)
│  ├─ 📁 Dependencies
│  │  └─ Packages (37 NuGet packages)
│  ├─ 📁 Converters
│  │  └─ ValueConverters.cs
│  ├─ 📁 Platforms
│  │  ├─ Android
│  │  ├─ iOS
│  │  ├─ MacCatalyst
│  │  ├─ Windows
│  │  └─ Tizen
│  ├─ 📁 Properties
│  │  └─ launchSettings.json
│  ├─ 📁 Resources
│  │  ├─ AppIcon
│  │  ├─ Fonts
│  │  ├─ Images
│  │  ├─ Raw
│  │  ├─ Splash
│  │  └─ Styles
│  ├─ 📁 Views
│  │  ├─ CreateQuotePage.xaml
│  │  └─ SettingsPage.xaml
│  ├─ 📄 App.xaml
│  ├─ 📄 AppShell.xaml
│  ├─ 📄 MainPage.xaml
│  ├─ 📄 MauiProgram.cs
│  └─ 📄 GlobalUsings.cs
│
├─ 📁 EstForge.Core
│  ├─ 📁 Helpers
│  │  └─ ItalianFormatHelper.cs
│  ├─ 📁 Services
│  │  ├─ DatabaseService.cs
│  │  └─ PdfGeneratorService.cs
│  └─ 📁 ViewModels
│     ├─ MainViewModel.cs
│     ├─ CreateQuoteViewModel.cs
│     └─ SettingsViewModel.cs
│
└─ 📁 EstForge.Data
   ├─ 📁 Context
   │  └─ EstForgeDbContext.cs
   ├─ 📁 Models
   │  ├─ Azienda.cs
   │  ├─ Cliente.cs
   │  ├─ Preventivo.cs
   │  ├─ RigaPreventivo.cs
   │  └─ PreventivoCache.cs
   └─ 📁 Migrations (generati automaticamente)
```

---

## 🎉 Primo Utilizzo App

Una volta avviata l'app vedrai:

1. **Dashboard Preventivi** (vuota all'inizio)
2. Menu laterale (hamburger ☰) con:
   - 🏠 Preventivi
   - ➕ Nuovo Preventivo
   - ⚙️ Impostazioni

### Cosa Fare

1. **Apri Impostazioni** (menu laterale → Impostazioni)
2. **Configura dati aziendali**:
   - Ragione sociale
   - P.IVA
   - Sede legale
   - Telefono
   - Email
3. **Salva**
4. **Torna alla Dashboard**
5. **Clicca "Nuovo"** per creare il tuo primo preventivo!

---

## 🐛 Risoluzione Problemi Comuni

### ❌ Errore: "Project needs to be restored"

**Causa**: Pacchetti NuGet non ripristinati

**Soluzione**:
1. **Tasto destro** sulla solution (in alto)
2. **"Restore NuGet Packages"**
3. Attendi completamento
4. **Build** → **Rebuild Solution**

---

### ❌ Errore: "Windows SDK not found"

**Causa**: SDK Windows mancante

**Soluzione**:
1. Apri **Visual Studio Installer**
2. **"Modify"** Visual Studio 2022
3. Vai su **"Individual Components"**
4. Cerca: **"Windows 10 SDK (10.0.19041.0)"**
5. Seleziona e **"Modify"**

---

### ❌ Errore: "Cannot connect to database"

**Causa**: SQL Server LocalDB non avviato

**Soluzione**:
1. Apri **Command Prompt** (come Admin)
2. Esegui:
   ```cmd
   sqllocaldb info
   sqllocaldb start mssqllocaldb
   ```

3. Riprova a eseguire l'app

**Alternativa**: Cambia connection string in `MauiProgram.cs` per usare SQL Server Express

---

### ❌ Build fallisce con errori strani

**Soluzione**:
1. **Build** → **Clean Solution**
2. Chiudi Visual Studio
3. Elimina le cartelle `bin/` e `obj/` da tutti e 3 i progetti
4. Riapri Visual Studio
5. **Build** → **Rebuild Solution**

---

### ❌ L'app si compila ma non si avvia

**Verifica**:
1. ✓ "EstForge.MAUI" è il progetto di startup (in grassetto)?
2. ✓ "Windows Machine" è selezionato come target?
3. ✓ Framework è `net8.0-windows10.0.19041.0`?

**Soluzione**:
1. Verifica punti sopra
2. **Clean** e **Rebuild**
3. Premi F5 di nuovo

---

### ❌ Mancano font OpenSans

**Effetto**: L'app usa font di sistema (comunque funziona)

**Soluzione (opzionale)**:
1. Scarica OpenSans da [Google Fonts](https://fonts.google.com/specimen/Open+Sans)
2. Metti i file `.ttf` in:
   ```
   EstForge.MAUI/Resources/Fonts/
   - OpenSans-Regular.ttf
   - OpenSans-Semibold.ttf
   ```
3. **Rebuild**

---

## 📊 Metriche Progetto

| Metrica | Valore |
|---------|--------|
| **Progetti** | 3 |
| **File totali** | 61 |
| **File C#** | 25 |
| **File XAML** | 8 |
| **Pacchetti NuGet** | 37 |
| **Piattaforme** | Windows, Android, iOS, Mac |
| **Dimensione build** | ~50 MB |
| **Tempo primo build** | 1-3 minuti |

---

## ✅ Checklist Completa Apertura

- [ ] Visual Studio 2022 installato (17.8+)
- [ ] Workload ".NET MAUI" installato
- [ ] File `EstForge.MAUI.sln` aperto
- [ ] NuGet packages ripristinati automaticamente
- [ ] Progetto "EstForge.MAUI" impostato come startup (in grassetto)
- [ ] Target framework: `net8.0-windows10.0.19041.0`
- [ ] Piattaforma: "Windows Machine" selezionata
- [ ] Build completato con successo (3/3 progetti)
- [ ] Premuto F5 → App si avvia in finestra Windows
- [ ] Database creato automaticamente in LocalDB
- [ ] Aperte Impostazioni e configurato dati aziendali

---

## 🎯 Prossimi Passi

Dopo aver aperto con successo:

1. **Esplora il codice**:
   - Apri `MainPage.xaml` per vedere la dashboard
   - Apri `MainViewModel.cs` per la logica
   - Apri `EstForgeDbContext.cs` per il database

2. **Crea un preventivo di test**:
   - Menu → Nuovo Preventivo
   - Compila tutti i campi
   - Aggiungi righe
   - Salva

3. **Genera un PDF**:
   - Seleziona un preventivo
   - Swipe o click destro → PDF
   - Visualizza e salva

4. **Personalizza**:
   - Vai su Impostazioni
   - Carica un logo (opzionale)
   - Regola dimensioni font
   - Abilita numerazione custom

---

## 📞 Supporto

Se hai ancora problemi:

1. **Verifica README.md** per dettagli completi
2. **Controlla CONVERSION_NOTES.md** per info tecniche
3. **Leggi i commenti nel codice** per spiegazioni

---

**Versione**: 1.0
**Data**: Novembre 2025
**Autore**: Convertito da React/Supabase a MAUI/SQL Server

✅ **Il progetto è COMPLETO e PRONTO all'uso!**
