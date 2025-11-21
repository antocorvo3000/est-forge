using EstForge.Core.ViewModels;

namespace EstForge.MAUI.Views;

public partial class CreateQuotePage : ContentPage
{
    private readonly CreateQuoteViewModel _viewModel;

    public CreateQuotePage(CreateQuoteViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = _viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.InitializeAsync();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        _viewModel.StopAutoSave();
    }
}
