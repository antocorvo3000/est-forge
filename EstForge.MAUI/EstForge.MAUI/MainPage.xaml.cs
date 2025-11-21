using EstForge.Core.ViewModels;
using EstForge.Core.Services;

namespace EstForge.MAUI;

public partial class MainPage : ContentPage
{
    private readonly MainViewModel _viewModel;
    private readonly IDatabaseService _databaseService;
    private readonly IDatabaseSeedService _seedService;
    private bool _databaseInitialized = false;

    public MainPage(MainViewModel viewModel, IDatabaseService databaseService, IDatabaseSeedService seedService)
    {
        InitializeComponent();
        _viewModel = viewModel;
        _databaseService = databaseService;
        _seedService = seedService;
        BindingContext = _viewModel;

        // Sottoscrivi al cambio di IsSelectionMode per animare le checkbox
        _viewModel.PropertyChanged += ViewModel_PropertyChanged;

        // Aggiungi hover effects a tutti i bottoni dopo che il contenuto è caricato
        this.Loaded += MainPage_Loaded;
    }

    private void MainPage_Loaded(object? sender, EventArgs e)
    {
        // Aggiungi effetti hover a tutti i bottoni
        var buttons = this.GetVisualTreeDescendants().OfType<Button>();
        foreach (var button in buttons)
        {
            AddButtonHoverEffect(button);
        }
    }

    private void AddButtonHoverEffect(Button button)
    {
        var originalColor = button.BackgroundColor;

        var pointerGesture = new PointerGestureRecognizer();

        pointerGesture.PointerEntered += async (s, e) =>
        {
            // Hover: brightness 110% (identico al React)
            await button.ScaleTo(1.05, 150, Easing.CubicOut);
            button.BackgroundColor = ApplyBrightness(originalColor, 1.1);
        };

        pointerGesture.PointerExited += async (s, e) =>
        {
            // Ritorna normale
            await button.ScaleTo(1.0, 150, Easing.CubicIn);
            button.BackgroundColor = originalColor;
        };

        pointerGesture.PointerPressed += async (s, e) =>
        {
            // Pressed: scale 0.95
            await button.ScaleTo(0.95, 100, Easing.Linear);
        };

        pointerGesture.PointerReleased += async (s, e) =>
        {
            // Release: ritorna a 1.05 (hover)
            await button.ScaleTo(1.05, 100, Easing.Linear);
        };

        button.GestureRecognizers.Add(pointerGesture);
    }

    private Color ApplyBrightness(Color color, double brightness)
    {
        // Applica brightness filter (come CSS brightness(110%))
        // brightness > 1.0 rende più luminoso, < 1.0 più scuro
        return Color.FromRgba(
            Math.Min(1.0, color.Red * brightness),
            Math.Min(1.0, color.Green * brightness),
            Math.Min(1.0, color.Blue * brightness),
            color.Alpha
        );
    }

    private async void ViewModel_PropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(MainViewModel.IsSelectionMode))
        {
            // Anima tutte le checkbox quando cambia la modalità selezione
            await AnimateCheckboxes(_viewModel.IsSelectionMode);
        }
        else if (e.PropertyName == nameof(MainViewModel.SelectedCount))
        {
            // Anima i bottom buttons quando cambia il numero di elementi selezionati
            await AnimateBottomButtons();
        }
    }

    private async Task AnimateBottomButtons()
    {
        // ONLY animate the selection-related buttons: btnSeleziona, btnDeseleziona, btnElimina
        // NEVER animate: btnNuovo, btnRecupera, btnImpostazioni

        var buttonsToFadeOut = new List<Button>();

        // Find currently visible selection buttons
        if (btnSeleziona.IsVisible)
        {
            buttonsToFadeOut.Add(btnSeleziona);
        }
        if (btnDeseleziona.IsVisible)
        {
            buttonsToFadeOut.Add(btnDeseleziona);
        }
        if (btnElimina.IsVisible)
        {
            buttonsToFadeOut.Add(btnElimina);
        }

        // Fade out currently visible selection buttons
        if (buttonsToFadeOut.Count > 0)
        {
            var fadeOutTasks = buttonsToFadeOut.Select(async b =>
            {
                await Task.WhenAll(
                    b.FadeTo(0, 200, Easing.CubicIn),
                    b.ScaleTo(0.9, 200, Easing.CubicIn)
                );
            });

            await Task.WhenAll(fadeOutTasks);
        }

        // Aspetta che la visibilità cambi (IsVisible binding si aggiorna)
        await Task.Delay(50);

        // Find newly visible selection buttons
        var buttonsToFadeIn = new List<Button>();

        if (btnSeleziona.IsVisible)
        {
            buttonsToFadeIn.Add(btnSeleziona);
        }
        if (btnDeseleziona.IsVisible)
        {
            buttonsToFadeIn.Add(btnDeseleziona);
        }
        if (btnElimina.IsVisible)
        {
            buttonsToFadeIn.Add(btnElimina);
        }

        // Fade in newly visible selection buttons
        foreach (var button in buttonsToFadeIn)
        {
            button.Opacity = 0;
            button.Scale = 0.9;

            await Task.WhenAll(
                button.FadeTo(1, 200, Easing.CubicOut),
                button.ScaleTo(1, 200, Easing.CubicOut)
            );
        }
    }

    private async Task AnimateCheckboxes(bool show)
    {
        // Cerca tutte le checkbox nella CollectionView
        var checkboxes = this.GetVisualTreeDescendants()
            .OfType<CheckBox>()
            .Where(cb => cb.Parent?.Parent is Grid); // Solo checkbox nelle righe preventivi

        if (show)
        {
            // ANIMAZIONE ENTRATA: opacity 0→1, scale 0.5→1 (300ms)
            foreach (var checkbox in checkboxes)
            {
                checkbox.Opacity = 0;
                checkbox.Scale = 0.5;
                checkbox.IsVisible = true;

                var fadeTask = checkbox.FadeTo(1, 300, Easing.CubicOut);
                var scaleTask = checkbox.ScaleTo(1, 300, Easing.CubicOut);

                await Task.WhenAll(fadeTask, scaleTask);
            }
        }
        else
        {
            // ANIMAZIONE USCITA: opacity 1→0, scale 1→0.5 (300ms)
            var tasks = new List<Task>();
            foreach (var checkbox in checkboxes)
            {
                var fadeTask = checkbox.FadeTo(0, 300, Easing.CubicIn);
                var scaleTask = checkbox.ScaleTo(0.5, 300, Easing.CubicIn);

                tasks.Add(fadeTask);
                tasks.Add(scaleTask);
            }

            await Task.WhenAll(tasks);

            // Nascondi dopo l'animazione
            foreach (var checkbox in checkboxes)
            {
                checkbox.IsVisible = false;
            }
        }
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        if (!_databaseInitialized)
        {
            try
            {
                await _databaseService.InitializeDatabaseAsync();
                _databaseInitialized = true;

                if (!await _seedService.IsDatabaseSeededAsync())
                {
                    await _seedService.SeedDatabaseAsync();
                }

                await _viewModel.InitializeAsync();
            }
            catch (Exception ex)
            {
                await DisplayAlert(
                    "Errore Database",
                    $"Impossibile inizializzare il database SQLite.\n\n" +
                    $"Dettagli: {ex.Message}\n\n" +
                    $"Il database verrà creato al percorso:\n" +
                    $"{Path.Combine(FileSystem.AppDataDirectory, "estforge.db")}",
                    "OK");
            }
        }
        else
        {
            await _viewModel.InitializeAsync();
        }
    }

    // Handler per effetto hover sul Frame con transizione smooth
    private void OnQuoteItemPointerEntered(object? sender, PointerEventArgs e)
    {
        if (sender is Frame frame)
        {
            // ANIMAZIONE HOVER: background white → grigio-bluastro (300ms)
            // React usa: linear-gradient(135deg, hsl(210 15% 88%), hsl(210 12% 85%))
            // Colore medio: #D7DCE1 (215, 220, 225)
            var animation = new Animation(v =>
            {
                // Interpola tra bianco (#FFFFFF) e grigio-bluastro (#D7DCE1)
                frame.BackgroundColor = Color.FromRgba(
                    255 + (215 - 255) * v,
                    255 + (220 - 255) * v,
                    255 + (225 - 255) * v,
                    255
                );
            }, 0, 1);

            animation.Commit(frame, "HoverIn", length: 300, easing: Easing.CubicOut);
        }
    }

    // Handler per chiudere info panel quando il mouse esce dalla riga
    private void OnQuoteItemPointerExited(object? sender, PointerEventArgs e)
    {
        if (sender is Frame frame)
        {
            // ANIMAZIONE HOVER OUT: grigio-bluastro → white (300ms)
            var animation = new Animation(v =>
            {
                // Interpola da grigio-bluastro (#D7DCE1) a bianco (#FFFFFF)
                frame.BackgroundColor = Color.FromRgba(
                    215 + (255 - 215) * v,
                    220 + (255 - 220) * v,
                    225 + (255 - 225) * v,
                    255
                );
            }, 0, 1);

            animation.Commit(frame, "HoverOut", length: 300, easing: Easing.CubicIn);
        }

        // Chiudi info panel
        _viewModel.InfoQuoteId = null;
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        _viewModel.PropertyChanged -= ViewModel_PropertyChanged;
    }
}
