using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EstForge.Core.Services;
using EstForge.Data.Models;

namespace EstForge.Core.ViewModels;

public partial class MainViewModel : BaseViewModel
{
    private readonly IDatabaseService _databaseService;

    [ObservableProperty]
    private ObservableCollection<Preventivo> _preventivi = new();

    [ObservableProperty]
    private Preventivo? _selectedPreventivo;

    [ObservableProperty]
    private string _searchText = string.Empty;

    [ObservableProperty]
    private int? _filtroAnno;

    [ObservableProperty]
    private bool _isRefreshing;

    [ObservableProperty]
    private bool _hasNoData;

    [ObservableProperty]
    private string _companyName = "EST-FORGE";

    public MainViewModel(IDatabaseService databaseService)
    {
        _databaseService = databaseService;
        Title = "Preventivi";
    }

    [RelayCommand]
    private async Task LoadPreventiviAsync()
    {
        if (IsBusy) return;

        try
        {
            IsBusy = true;
            ErrorMessage = string.Empty;

            var preventivi = string.IsNullOrWhiteSpace(SearchText)
                ? await _databaseService.GetAllPreventiviAsync(FiltroAnno)
                : await _databaseService.SearchPreventiviAsync(SearchText);

            Preventivi.Clear();
            foreach (var preventivo in preventivi)
            {
                Preventivi.Add(preventivo);
            }

            HasNoData = Preventivi.Count == 0;
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Errore nel caricamento: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
            IsRefreshing = false;
        }
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        IsRefreshing = true;
        await LoadPreventiviAsync();
    }

    [RelayCommand]
    private async Task SearchAsync()
    {
        await LoadPreventiviAsync();
    }

    [RelayCommand]
    private async Task ClearSearchAsync()
    {
        SearchText = string.Empty;
        await LoadPreventiviAsync();
    }

    [RelayCommand]
    private async Task DeletePreventivoAsync(Guid id)
    {
        try
        {
            IsBusy = true;
            var success = await _databaseService.DeletePreventivoAsync(id);
            if (success)
            {
                await LoadPreventiviAsync();
            }
            else
            {
                ErrorMessage = "Errore durante l'eliminazione";
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Errore: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task LoadCompanyInfoAsync()
    {
        var azienda = await _databaseService.GetAziendaAsync();
        if (azienda != null)
        {
            CompanyName = azienda.RagioneSociale;
        }
    }

    public async Task InitializeAsync()
    {
        await LoadCompanyInfoAsync();
        await LoadPreventiviAsync();
    }
}
