using Microsoft.Maui.LifecycleEvents;

namespace EstForge.MAUI.WinUI;

public static class WindowConfiguration
{
    public static MauiAppBuilder ConfigureWindows(this MauiAppBuilder builder)
    {
        builder.ConfigureLifecycleEvents(events =>
        {
#if WINDOWS
            events.AddWindows(windows => windows
                .OnWindowCreated(window =>
                {
                    // Assicurati che la finestra sia visibile e in primo piano
                    window.Activate();

                    // Configura dimensioni minime e iniziali
                    var handle = WinRT.Interop.WindowNative.GetWindowHandle(window);
                    var windowId = Microsoft.UI.Win32Interop.GetWindowIdFromWindow(handle);
                    var appWindow = Microsoft.UI.Windowing.AppWindow.GetFromWindowId(windowId);

                    if (appWindow != null)
                    {
                        // Imposta dimensioni iniziali
                        appWindow.Resize(new Windows.Graphics.SizeInt32(1400, 900));

                        // Centra la finestra
                        var displayArea = Microsoft.UI.Windowing.DisplayArea.GetFromWindowId(windowId, Microsoft.UI.Windowing.DisplayAreaFallback.Nearest);
                        if (displayArea != null)
                        {
                            var centerX = (displayArea.WorkArea.Width - 1400) / 2;
                            var centerY = (displayArea.WorkArea.Height - 900) / 2;
                            appWindow.Move(new Windows.Graphics.PointInt32(centerX, centerY));
                        }

                        // Mostra la finestra
                        appWindow.Show();
                    }
                }));
#endif
        });

        return builder;
    }
}
