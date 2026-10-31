using System.Diagnostics;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace DaxabitHMS.Launcher;

internal sealed class MainForm : Form
{
    private readonly WebView2 _webView = new() { Dock = DockStyle.Fill };
    private Panel? _loadingPanel;
    private Label? _loadingStatusLabel;
    private Panel? _connectionErrorPanel;
    private Panel? _fatalErrorPanel;
    private System.Windows.Forms.Timer? _autoReconnectTimer;
    private bool _isReconnecting;

    private AppConfig _config;
    private ServerSupervisor? _supervisor;
    private TrayIcon? _tray;
    private bool _allowClose;
    private readonly EventWaitHandle _activateEvent;
    private RegisteredWaitHandle? _activateWaitHandle;

    private bool _isFullScreen;
    private FormWindowState _previousWindowState = FormWindowState.Normal;
    private FormBorderStyle _previousBorderStyle = FormBorderStyle.Sizable;

    public MainForm(EventWaitHandle activateEvent)
    {
        Text = "DaxabitHMS";
        StartPosition = FormStartPosition.CenterScreen;
        Size = new Size(1360, 860);
        MinimumSize = new Size(900, 600);
        AutoScaleMode = AutoScaleMode.Dpi;
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath) ?? SystemIcons.Application;

        _config = AppConfig.Load();
        _activateEvent = activateEvent;

        BuildMenu();
        BuildLoadingPanel();
        Controls.Add(_webView);

        Load += async (_, _) => await InitializeAsync();
        FormClosing += OnFormClosing;

        _activateWaitHandle = ThreadPool.RegisterWaitForSingleObject(
            _activateEvent,
            (_, _) => { if (InvokeRequired) BeginInvoke((Action)RestoreFromTray); else RestoreFromTray(); },
            null,
            Timeout.InfiniteTimeSpan,
            false);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _autoReconnectTimer?.Stop();
            _autoReconnectTimer?.Dispose();
            _activateWaitHandle?.Unregister(null);
            _tray?.Dispose();
            _supervisor?.Dispose();
        }
        base.Dispose(disposing);
    }

    private void BuildMenu()
    {
        var menu = new MenuStrip();

        // --- File Menu ---
        var fileMenu = new ToolStripMenuItem("&File");

        var reconnectItem = new ToolStripMenuItem("&Reconnect", null, async (_, _) => await ReconnectAsync())
        {
            ShortcutKeys = Keys.Control | Keys.R
        };
        fileMenu.DropDownItems.Add(reconnectItem);

        var changeServer = new ToolStripMenuItem("Change server &address…", null, async (_, _) => await ChangeServerAsync());
        fileMenu.DropDownItems.Add(changeServer);

        if (_config.IsEmbedded)
        {
            var serverSync = new ToolStripMenuItem("Server &sync…", null, (_, _) =>
            {
                if (_webView.CoreWebView2 is not null)
                {
                    _webView.CoreWebView2.Navigate($"{_config.ServerUrl}/settings/sync");
                }
            });
            fileMenu.DropDownItems.Add(serverSync);
        }

        var printItem = new ToolStripMenuItem("&Print…", null, (_, _) =>
        {
            if (_webView.CoreWebView2 is not null)
            {
                _webView.CoreWebView2.ShowPrintUI(CoreWebView2PrintDialogKind.Browser);
            }
        })
        {
            ShortcutKeys = Keys.Control | Keys.P
        };
        fileMenu.DropDownItems.Add(printItem);

        fileMenu.DropDownItems.Add(new ToolStripSeparator());

        var removeData = new ToolStripMenuItem("Remove All Local Data && &Uninstall…", null, async (_, _) => await RemoveAllDataAndUninstallAsync());
        fileMenu.DropDownItems.Add(removeData);

        var exit = new ToolStripMenuItem("E&xit", null, (_, _) => RequestRealExit())
        {
            ShortcutKeys = Keys.Alt | Keys.F4
        };
        fileMenu.DropDownItems.Add(exit);

        // --- View Menu ---
        var viewMenu = new ToolStripMenuItem("&View");

        var reload = new ToolStripMenuItem("&Reload", null, (_, _) => _webView.Reload()) { ShortcutKeys = Keys.F5 };
        viewMenu.DropDownItems.Add(reload);

        viewMenu.DropDownItems.Add(new ToolStripSeparator());

        var zoomIn = new ToolStripMenuItem("Zoom &In", null, (_, _) =>
        {
            if (_webView.CoreWebView2 is not null) _webView.CoreWebView2.Settings.IsZoomControlEnabled = true;
            _webView.ZoomFactor = Math.Min(3.0, _webView.ZoomFactor + 0.1);
        })
        {
            ShortcutKeys = Keys.Control | Keys.Oemplus
        };
        viewMenu.DropDownItems.Add(zoomIn);

        var zoomOut = new ToolStripMenuItem("Zoom &Out", null, (_, _) =>
        {
            _webView.ZoomFactor = Math.Max(0.5, _webView.ZoomFactor - 0.1);
        })
        {
            ShortcutKeys = Keys.Control | Keys.OemMinus
        };
        viewMenu.DropDownItems.Add(zoomOut);

        var resetZoom = new ToolStripMenuItem("Reset &Zoom", null, (_, _) =>
        {
            _webView.ZoomFactor = 1.0;
        })
        {
            ShortcutKeys = Keys.Control | Keys.D0
        };
        viewMenu.DropDownItems.Add(resetZoom);

        viewMenu.DropDownItems.Add(new ToolStripSeparator());

        var fullScreen = new ToolStripMenuItem("Toggle &Full Screen", null, (_, _) => ToggleFullScreen())
        {
            ShortcutKeys = Keys.F11
        };
        viewMenu.DropDownItems.Add(fullScreen);

        // --- Help Menu ---
        var helpMenu = new ToolStripMenuItem("&Help");

        var diagItem = new ToolStripMenuItem("Support && &Diagnostics…", null, (_, _) =>
        {
            using var diag = new DiagnosticsForm(_config);
            diag.ShowDialog(this);
        });
        helpMenu.DropDownItems.Add(diagItem);

        var aboutItem = new ToolStripMenuItem("&About DaxabitHMS…", null, (_, _) =>
        {
            using var about = new AboutForm(_config);
            about.ShowDialog(this);
        });
        helpMenu.DropDownItems.Add(aboutItem);

        menu.Items.Add(fileMenu);
        menu.Items.Add(viewMenu);
        menu.Items.Add(helpMenu);

        MainMenuStrip = menu;
        Controls.Add(menu);
    }

    private void ToggleFullScreen()
    {
        if (!_isFullScreen)
        {
            _previousWindowState = WindowState;
            _previousBorderStyle = FormBorderStyle;

            FormBorderStyle = FormBorderStyle.None;
            WindowState = FormWindowState.Maximized;
            _isFullScreen = true;
        }
        else
        {
            FormBorderStyle = _previousBorderStyle;
            WindowState = _previousWindowState;
            _isFullScreen = false;
        }
    }

    private void BuildLoadingPanel()
    {
        _loadingPanel = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = Color.FromArgb(248, 249, 250),
            Visible = false,
        };

        var title = new Label
        {
            Text = "DaxabitHMS",
            Font = new Font("Segoe UI", 18f, FontStyle.Bold),
            ForeColor = Color.FromArgb(33, 37, 41),
            AutoSize = false,
            Dock = DockStyle.Top,
            Height = 60,
            TextAlign = ContentAlignment.BottomCenter,
        };

        _loadingStatusLabel = new Label
        {
            Text = "Connecting to restaurant server…",
            Font = new Font("Segoe UI", 11f),
            ForeColor = Color.FromArgb(108, 117, 125),
            AutoSize = false,
            Dock = DockStyle.Top,
            Height = 40,
            TextAlign = ContentAlignment.MiddleCenter,
        };

        _loadingPanel.Controls.Add(_loadingStatusLabel);
        _loadingPanel.Controls.Add(title);
        Controls.Add(_loadingPanel);
        _loadingPanel.BringToFront();
    }

    private async Task InitializeAsync()
    {
        if (string.IsNullOrWhiteSpace(_config.Mode))
        {
            using var choiceDialog = new FirstRunChoiceForm();
            var choiceResult = choiceDialog.ShowDialog(this);
            if (choiceResult != DialogResult.OK || choiceDialog.Result is null)
            {
                Close();
                return;
            }

            if (choiceDialog.Result == FirstRunChoice.Embedded)
            {
                _config.Mode = "embedded";
                _config.ServerUrl = $"http://localhost:{ServerPaths.WebPort}";
                _config.Save();
            }
            else
            {
                await ChangeServerAsync(isFirstRun: true);
                if (_config.ServerUrl is null) return;
                _config.Mode = "remote";
                _config.Save();
            }

            Controls.Remove(MainMenuStrip);
            BuildMenu();
        }
        else if (!_config.IsEmbedded &&
                 (string.IsNullOrWhiteSpace(_config.ServerUrl) || !AppConfig.IsValidServerUrl(_config.ServerUrl, out _)))
        {
            await ChangeServerAsync(isFirstRun: true);
        }

        if (_config.IsEmbedded && !await StartEmbeddedServerAsync())
        {
            return;
        }

        Directory.CreateDirectory(AppConfig.WebView2UserDataFolder);
        try
        {
            var env = await CoreWebView2Environment.CreateAsync(
                userDataFolder: AppConfig.WebView2UserDataFolder);
            await _webView.EnsureCoreWebView2Async(env);
        }
        catch (WebView2RuntimeNotFoundException)
        {
            ShowFatalError(
                "The Microsoft Edge WebView2 Runtime is required but isn't installed on this PC.\n\n" +
                "Install it from https://go.microsoft.com/fwlink/p/?LinkId=2124703 (Evergreen Bootstrapper), then reopen DaxabitHMS.");
            return;
        }
        catch (Exception ex)
        {
            ShowFatalError($"Could not start the embedded browser component.\n\n{ex.Message}");
            return;
        }

        // Configure native WebView2 security & enterprise isolation
        var settings = _webView.CoreWebView2.Settings;
        settings.AreDevToolsEnabled = false;
        settings.AreDefaultContextMenusEnabled = false;
        settings.IsStatusBarEnabled = false;
        settings.IsZoomControlEnabled = true;
        settings.IsSwipeNavigationEnabled = false;

        // Keep external popups inside or open external URLs in OS browser
        _webView.CoreWebView2.NewWindowRequested += (_, args) =>
        {
            args.Handled = true;
            if (Uri.TryCreate(args.Uri, UriKind.Absolute, out var uri) && IsTrustedServerUri(uri))
            {
                _webView.CoreWebView2.Navigate(args.Uri);
            }
            else
            {
                try { Process.Start(new ProcessStartInfo(args.Uri) { UseShellExecute = true }); } catch { }
            }
        };

        // Restrict navigation to trusted application origins
        _webView.CoreWebView2.NavigationStarting += OnNavigationStarting;

        // Secure download handling: route to Downloads folder
        _webView.CoreWebView2.DownloadStarting += (_, args) =>
        {
            var downloadsFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                "Downloads");
            if (Directory.Exists(downloadsFolder))
            {
                args.ResultFilePath = Path.Combine(downloadsFolder, Path.GetFileName(args.ResultFilePath));
            }
            args.Handled = false;
        };

        _webView.NavigationCompleted += (_, args) =>
        {
            if (!args.IsSuccess)
            {
                ShowConnectionError();
            }
            else
            {
                HideConnectionError();
                HideLoading();
                _webView.Visible = true;
            }
        };

        Navigate();
    }

    private void OnNavigationStarting(object? sender, CoreWebView2NavigationStartingEventArgs e)
    {
        if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri))
        {
            e.Cancel = true;
            return;
        }

        // Block dangerous schemes
        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
        {
            e.Cancel = true;
            return;
        }

        // Allow navigation within configured restaurant server
        if (IsTrustedServerUri(uri))
        {
            return;
        }

        // For untrusted external websites, cancel in-app navigation and open safely in default browser
        e.Cancel = true;
        try
        {
            Process.Start(new ProcessStartInfo(e.Uri) { UseShellExecute = true });
        }
        catch
        {
            // best-effort
        }
    }

    private bool IsTrustedServerUri(Uri uri)
    {
        if (_config.ServerUrl is null) return false;
        if (!Uri.TryCreate(_config.ServerUrl, UriKind.Absolute, out var serverUri)) return false;

        if (string.Equals(uri.Host, serverUri.Host, StringComparison.OrdinalIgnoreCase) &&
            uri.Port == serverUri.Port)
        {
            return true;
        }

        if (_config.IsEmbedded &&
            (uri.Host is "localhost" or "127.0.0.1") &&
            (uri.Port == ServerPaths.WebPort || uri.Port == ServerPaths.BackendPort))
        {
            return true;
        }

        return false;
    }

    private async Task<bool> StartEmbeddedServerAsync()
    {
        if (await IsServerAlreadyHealthyAsync())
        {
            ShowStatus("Connected to local DaxabitHMS service.");
            return true;
        }

        _supervisor = new ServerSupervisor();
        _supervisor.StatusChanged += status =>
        {
            if (InvokeRequired) { BeginInvoke((Action)(() => ShowStatus(status))); return; }
            ShowStatus(status);
        };
        _supervisor.Faulted += message =>
        {
            if (InvokeRequired) { BeginInvoke((Action)(() => _tray?.ShowBalloon("DaxabitHMS", message))); return; }
            _tray?.ShowBalloon("DaxabitHMS", message);
        };

        ShowStatus("Starting local server…");
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(15));
            await _supervisor.StartAsync(cts.Token);
        }
        catch (Exception ex)
        {
            try
            {
                File.AppendAllText(
                    Path.Combine(ServerPaths.ServerLogDir, "supervisor-error.log"),
                    $"{DateTime.UtcNow:O} {ex}\n");
            }
            catch { }

            ShowFatalError(
                technicalMessage: $"Could not start the embedded server.\n\n{ex.Message}\n\nLogs: {ServerPaths.ServerLogDir}",
                friendlyHeadline: "DaxabitHMS couldn't start its local database",
                friendlyBody: "Your restaurant data has not been deleted. DaxabitHMS was unable to start its local database service.",
                retry: async () => { Controls.Remove(_fatalErrorPanel); _fatalErrorPanel = null; await InitializeAsync(); });
            return false;
        }

        _tray = new TrayIcon(Icon!);
        _tray.OpenRequested += () =>
        {
            if (InvokeRequired) { BeginInvoke((Action)RestoreFromTray); return; }
            RestoreFromTray();
        };
        _tray.StopAndExitRequested += async () =>
        {
            if (InvokeRequired) { BeginInvoke((Action)(async () => await StopServerAndExitAsync())); return; }
            await StopServerAndExitAsync();
        };
        _tray.RemoveDataAndUninstallRequested += async () =>
        {
            if (InvokeRequired) { BeginInvoke((Action)(async () => await RemoveAllDataAndUninstallAsync())); return; }
            await RemoveAllDataAndUninstallAsync();
        };
        return true;
    }

    private static async Task<bool> IsServerAlreadyHealthyAsync()
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
            using var resp = await client.GetAsync($"http://127.0.0.1:{ServerPaths.WebPort}/api/health");
            return resp.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private void RestoreFromTray()
    {
        Show();
        WindowState = FormWindowState.Normal;
        Activate();
    }

    private async Task StopServerAndExitAsync()
    {
        ShowStatus("Stopping server…");
        if (_supervisor is not null) await _supervisor.StopAsync();
        RequestRealExit();
    }

    private void RequestRealExit()
    {
        _allowClose = true;
        Close();
    }

    private async Task RemoveAllDataAndUninstallAsync()
    {
        RestoreFromTray();

        var confirm = MessageBox.Show(
            this,
            "This permanently deletes ALL local DaxabitHMS data on this PC — your restaurant's " +
            "database, uploaded images, and settings. This cannot be undone.\n\n" +
            "Only do this if you're uninstalling DaxabitHMS from this PC, or want to start " +
            "completely fresh.\n\nContinue?",
            "Remove All Local Data",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Warning,
            MessageBoxDefaultButton.Button2);
        if (confirm != DialogResult.Yes) return;

        ShowStatus("Stopping server and removing local data…");
        if (_supervisor is not null) await _supervisor.StopAsync();

        _webView.Dispose();

        var dataDir = AppConfig.ConfigDir;
        string? deleteError = null;
        for (var attempt = 1; attempt <= 5; attempt++)
        {
            try
            {
                if (Directory.Exists(dataDir)) Directory.Delete(dataDir, recursive: true);
                deleteError = null;
                break;
            }
            catch (Exception ex)
            {
                deleteError = ex.Message;
                await Task.Delay(500);
            }
        }

        _allowClose = true;
        if (deleteError is null)
        {
            MessageBox.Show(
                this,
                "Local data removed. Windows Settings will now open — find \"DaxabitHMS\" " +
                "and click Uninstall to finish removing the app.",
                "DaxabitHMS",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);
        }
        else
        {
            MessageBox.Show(
                this,
                $"The server was stopped, but some files could not be deleted automatically:\n\n{deleteError}\n\n" +
                $"You can safely delete this folder by hand once DaxabitHMS is closed: {dataDir}\n\n" +
                "Windows Settings will now open so you can uninstall the app.",
                "DaxabitHMS",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
        }

        try { Process.Start(new ProcessStartInfo("ms-settings:appsfeatures") { UseShellExecute = true }); } catch { }
        Close();
    }

    private void OnFormClosing(object? sender, FormClosingEventArgs e)
    {
        if (_config.IsEmbedded && !_allowClose && e.CloseReason == CloseReason.UserClosing)
        {
            e.Cancel = true;
            Hide();
            _tray?.ShowBalloon(
                "DaxabitHMS",
                "Still running in the background so other devices stay connected. Use the tray icon to reopen or fully stop it.",
                ToolTipIcon.Info);
        }
    }

    private void Navigate()
    {
        if (_config.ServerUrl is null) return;
        ShowLoading($"Loading {_config.ServerUrl}…");
        _webView.CoreWebView2?.Navigate(_config.ServerUrl);
    }

    private async Task ReconnectAsync()
    {
        if (_isReconnecting) return;
        _isReconnecting = true;
        try
        {
            ShowLoading("Reconnecting to server…");
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            var (ok, _) = await AppConfig.TestConnectionAsync(_config.ServerUrl ?? "", cts.Token);
            if (ok)
            {
                HideConnectionError();
                _webView.Reload();
            }
            else
            {
                ShowConnectionError();
            }
        }
        finally
        {
            _isReconnecting = false;
        }
    }

    private void ShowStatus(string message)
    {
        ShowLoading(message);
        _tray?.SetStatus(message);
    }

    private void ShowLoading(string text)
    {
        if (_loadingStatusLabel is not null) _loadingStatusLabel.Text = text;
        if (_loadingPanel is not null)
        {
            _loadingPanel.Visible = true;
            _loadingPanel.BringToFront();
        }
        _webView.Visible = false;
    }

    private void HideLoading()
    {
        if (_loadingPanel is not null) _loadingPanel.Visible = false;
    }

    private void ShowConnectionError()
    {
        HideLoading();
        _webView.Visible = false;

        if (_connectionErrorPanel is null)
        {
            _connectionErrorPanel = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(248, 249, 250),
            };

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 4,
            };
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 35f));
            layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 65f));

            var headline = new Label
            {
                Text = "Unable to connect to DaxabitHMS Server",
                Font = new Font("Segoe UI", 16f, FontStyle.Bold),
                ForeColor = Color.FromArgb(220, 53, 69),
                AutoSize = false,
                Dock = DockStyle.Top,
                Height = 45,
                TextAlign = ContentAlignment.MiddleCenter,
            };

            var body = new Label
            {
                Text = $"Could not reach {_config.ServerUrl}\n\n" +
                       "Check that the DaxabitHMS server is running and this device is on the same local network.",
                Font = new Font("Segoe UI", 10.5f),
                ForeColor = Color.FromArgb(73, 80, 87),
                AutoSize = false,
                Dock = DockStyle.Top,
                Height = 60,
                TextAlign = ContentAlignment.MiddleCenter,
            };

            var buttons = new FlowLayoutPanel
            {
                FlowDirection = FlowDirection.LeftToRight,
                AutoSize = true,
                Dock = DockStyle.Top,
                Anchor = AnchorStyles.None,
            };

            var reconnectBtn = new Button { Text = "Reconnect Now", AutoSize = true, Margin = new Padding(8), Font = new Font("Segoe UI", 10f) };
            reconnectBtn.Click += async (_, _) => await ReconnectAsync();
            buttons.Controls.Add(reconnectBtn);

            var changeServerBtn = new Button { Text = "Change Server Address…", AutoSize = true, Margin = new Padding(8), Font = new Font("Segoe UI", 10f) };
            changeServerBtn.Click += async (_, _) => await ChangeServerAsync();
            buttons.Controls.Add(changeServerBtn);

            var diagBtn = new Button { Text = "Diagnostics…", AutoSize = true, Margin = new Padding(8), Font = new Font("Segoe UI", 10f) };
            diagBtn.Click += (_, _) =>
            {
                using var diag = new DiagnosticsForm(_config);
                diag.ShowDialog(this);
            };
            buttons.Controls.Add(diagBtn);

            var buttonsWrapper = new Panel { Dock = DockStyle.Top, Height = 60 };
            buttonsWrapper.Controls.Add(buttons);
            buttonsWrapper.Resize += (_, _) => buttons.Left = Math.Max(0, (buttonsWrapper.Width - buttons.Width) / 2);

            layout.Controls.Add(headline, 0, 1);
            layout.Controls.Add(body, 0, 2);
            layout.Controls.Add(buttonsWrapper, 0, 3);

            _connectionErrorPanel.Controls.Add(layout);
            Controls.Add(_connectionErrorPanel);
        }

        _connectionErrorPanel.Visible = true;
        _connectionErrorPanel.BringToFront();

        // Start background auto-reconnect timer
        if (_autoReconnectTimer is null)
        {
            _autoReconnectTimer = new System.Windows.Forms.Timer { Interval = 5000 };
            _autoReconnectTimer.Tick += async (_, _) =>
            {
                if (!_isReconnecting && _connectionErrorPanel?.Visible == true && !string.IsNullOrWhiteSpace(_config.ServerUrl))
                {
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
                    var (ok, _) = await AppConfig.TestConnectionAsync(_config.ServerUrl, cts.Token);
                    if (ok)
                    {
                        _autoReconnectTimer.Stop();
                        HideConnectionError();
                        _webView.Reload();
                    }
                }
            };
        }
        _autoReconnectTimer.Start();
    }

    private void HideConnectionError()
    {
        _autoReconnectTimer?.Stop();
        if (_connectionErrorPanel is not null) _connectionErrorPanel.Visible = false;
    }

    private void ShowFatalError(
        string technicalMessage,
        string? friendlyHeadline = null,
        string? friendlyBody = null,
        Func<Task>? retry = null)
    {
        HideLoading();
        HideConnectionError();
        _webView.Visible = false;
        _fatalErrorPanel?.Dispose();

        var layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 3,
        };
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));

        var headline = new Label
        {
            Text = friendlyHeadline ?? "DaxabitHMS couldn't start",
            Font = new Font("Segoe UI", 14f, FontStyle.Bold),
            ForeColor = Color.FromArgb(220, 53, 69),
            AutoSize = false,
            Dock = DockStyle.Top,
            Height = 50,
            TextAlign = ContentAlignment.MiddleCenter,
        };
        var body = new Label
        {
            Text = friendlyBody ?? technicalMessage,
            Font = new Font("Segoe UI", 10f),
            AutoSize = false,
            Dock = DockStyle.Top,
            Height = 90,
            TextAlign = ContentAlignment.MiddleCenter,
            Padding = new Padding(24, 0, 24, 0),
        };

        var buttons = new FlowLayoutPanel
        {
            FlowDirection = FlowDirection.LeftToRight,
            AutoSize = true,
            Dock = DockStyle.Top,
            Anchor = AnchorStyles.None,
        };

        if (retry is not null)
        {
            var retryButton = new Button { Text = "Retry", AutoSize = true, Margin = new Padding(6) };
            retryButton.Click += async (_, _) => await retry();
            buttons.Controls.Add(retryButton);
        }

        var openLogsButton = new Button { Text = "Open Logs", AutoSize = true, Margin = new Padding(6) };
        openLogsButton.Click += (_, _) =>
        {
            try
            {
                Directory.CreateDirectory(ServerPaths.ServerLogDir);
                Process.Start(new ProcessStartInfo(ServerPaths.ServerLogDir) { UseShellExecute = true });
            }
            catch { }
        };
        buttons.Controls.Add(openLogsButton);

        var copyButton = new Button { Text = "Copy Diagnostic Information", AutoSize = true, Margin = new Padding(6) };
        copyButton.Click += (_, _) =>
        {
            try { Clipboard.SetText(technicalMessage); } catch { }
        };
        buttons.Controls.Add(copyButton);

        var buttonsWrapper = new Panel { Dock = DockStyle.Top, Height = 50 };
        buttons.Left = 0;
        buttons.Top = 0;
        buttonsWrapper.Controls.Add(buttons);
        buttonsWrapper.Resize += (_, _) => buttons.Left = Math.Max(0, (buttonsWrapper.Width - buttons.Width) / 2);

        layout.Controls.Add(headline, 0, 0);
        layout.Controls.Add(body, 0, 1);
        layout.Controls.Add(buttonsWrapper, 0, 2);

        var wrapper = new Panel { Dock = DockStyle.Fill };
        wrapper.Controls.Add(layout);

        Controls.Add(wrapper);
        wrapper.BringToFront();
        _fatalErrorPanel = wrapper;
    }

    private async Task ChangeServerAsync(bool isFirstRun = false)
    {
        using var dialog = new ServerSettingsForm(_config.ServerUrl);
        var result = dialog.ShowDialog(this);
        if (result != DialogResult.OK || dialog.Result is null)
        {
            if (isFirstRun) Close();
            return;
        }
        _config.ServerUrl = dialog.Result;
        _config.Save();
        HideConnectionError();
        if (_webView.CoreWebView2 is not null) Navigate();
        await Task.CompletedTask;
    }
}
