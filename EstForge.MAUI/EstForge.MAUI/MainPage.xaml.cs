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
            // Hover: brightness 110% (più chiaro)
            await button.ScaleTo(1.05, 150, Easing.CubicOut);
            button.BackgroundColor = LightenColor(originalColor, 0.1);
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

    private Color LightenColor(Color color, double amount)
    {
        // Aumenta la luminosità del colore
        return Color.FromRgba(
            Math.Min(255, color.Red * 255 * (1 + amount)),
            Math.Min(255, color.Green * 255 * (1 + amount)),
            Math.Min(255, color.Blue * 255 * (1 + amount)),
            color.Alpha * 255
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
        // Trova i bottoni bottom che stanno per diventare invisibili
        var allBottomButtons = this.GetVisualTreeDescendants()
            .OfType<Button>()
            .Where(b => b.IsVisible && (b.Text?.Contains("Nuovo Preventivo") == true ||
                                        b.Text?.Contains("Seleziona preventivi") == true ||
                                        b.Text?.Contains("Deseleziona") == true ||
                                        b.Text?.Contains("Elimina selezionati") == true));

        // Fade out i bottoni che stanno per scomparire
        var fadeOutTasks = allBottomButtons.Select(async b =>
        {
            await Task.WhenAll(
                b.FadeTo(0, 200, Easing.CubicIn),
                b.ScaleTo(0.9, 200, Easing.CubicIn)
            );
        });

        await Task.WhenAll(fadeOutTasks);

        // Aspetta che la visibilità cambi (IsVisible binding si aggiorna)
        await Task.Delay(50);

        // Trova i nuovi bottoni visibili
        var newVisibleButtons = this.GetVisualTreeDescendants()
            .OfType<Button>()
            .Where(b => b.IsVisible && (b.Text?.Contains("Nuovo Preventivo") == true ||
                                        b.Text?.Contains("Seleziona preventivi") == true ||
                                        b.Text?.Contains("Deseleziona") == true ||
                                        b.Text?.Contains("Elimina selezionati") == true));

        // Fade in i nuovi bottoni
        foreach (var button in newVisibleButtons)
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
    private async void OnQuoteItemPointerEntered(object? sender, PointerEventArgs e)
    {
        if (sender is Frame frame)
        {
            // ANIMAZIONE HOVER: background white → grigio chiaro (300ms)
            var animation = new Animation(v =>
            {
                // Interpola tra bianco (#FFFFFF) e grigio chiaro (#E8EEF2)
                frame.BackgroundColor = Color.FromRgba(
                    255 + (232 - 255) * v,
                    255 + (238 - 255) * v,
                    255 + (242 - 255) * v,
                    255
                );
            }, 0, 1);

            animation.Commit(frame, "HoverIn", length: 300, easing: Easing.CubicOut);
        }
    }

    // Handler per chiudere info panel quando il mouse esce dalla riga
    private async void OnQuoteItemPointerExited(object? sender, PointerEventArgs e)
    {
        if (sender is Frame frame)
        {
            // ANIMAZIONE HOVER OUT: grigio chiaro → white (300ms)
            var animation = new Animation(v =>
            {
                // Interpola da grigio chiaro (#E8EEF2) a bianco (#FFFFFF)
                frame.BackgroundColor = Color.FromRgba(
                    232 + (255 - 232) * v,
                    238 + (255 - 238) * v,
                    242 + (255 - 242) * v,
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
