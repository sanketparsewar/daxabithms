using System.Diagnostics;
using Microsoft.Web.WebView2.Core;

namespace DaxabitHMS.Launcher;

internal sealed class DiagnosticsForm : Form
{
    private readonly AppConfig _config;
    private readonly TextBox _detailsBox;
    private readonly Label _pingStatusLabel;

    public DiagnosticsForm(AppConfig config)
    {
        _config = config;
        Text = "DaxabitHMS - Support & Diagnostics";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterParent;
        MaximizeBox = false;
        MinimizeBox = false;
        ClientSize = new Size(640, 530);
        ShowInTaskbar = false;

        var header = new Label
        {
            Text = "System Support & Diagnostics",
            Font = new Font("Segoe UI", 13f, FontStyle.Bold),
            Location = new Point(20, 16),
            Size = new Size(600, 28),
        };

        _detailsBox = new TextBox
        {
            Multiline = true,
            ReadOnly = true,
            ScrollBars = ScrollBars.Vertical,
            Font = new Font("Consolas", 9f),
            Location = new Point(20, 50),
            Size = new Size(600, 360),
            BackColor = Color.White,
        };

        _pingStatusLabel = new Label
        {
            Text = "Testing server connection...",
            Font = new Font("Segoe UI", 9f),
            ForeColor = SystemColors.GrayText,
            Location = new Point(20, 422),
            Size = new Size(400, 22),
        };

        var copyBtn = new Button
        {
            Text = "Copy Diagnostics",
            Location = new Point(20, 456),
            Size = new Size(130, 34),
        };
        copyBtn.Click += (_, _) =>
        {
            try
            {
                Clipboard.SetText(_detailsBox.Text);
                MessageBox.Show(this, "Diagnostic details copied to clipboard.", "Diagnostics", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch { }
        };

        var openLogsBtn = new Button
        {
            Text = "Open Logs Folder",
            Location = new Point(158, 456),
            Size = new Size(130, 34),
        };
        openLogsBtn.Click += (_, _) =>
        {
            try
            {
                var dir = Directory.Exists(ServerPaths.ServerLogDir) ? ServerPaths.ServerLogDir : AppConfig.LogDir;
                Directory.CreateDirectory(dir);
                Process.Start(new ProcessStartInfo(dir) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                MessageBox.Show(this, $"Could not open logs: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        };

        var testConnBtn = new Button
        {
            Text = "Retest Connection",
            Location = new Point(296, 456),
            Size = new Size(130, 34),
        };
        testConnBtn.Click += async (_, _) => await RunConnectionTestAsync();

        var closeBtn = new Button
        {
            Text = "Close",
            DialogResult = DialogResult.OK,
            Location = new Point(520, 456),
            Size = new Size(100, 34),
        };
        AcceptButton = closeBtn;

        Controls.Add(header);
        Controls.Add(_detailsBox);
        Controls.Add(_pingStatusLabel);
        Controls.Add(copyBtn);
        Controls.Add(openLogsBtn);
        Controls.Add(testConnBtn);
        Controls.Add(closeBtn);

        Load += async (_, _) =>
        {
            PopulateDiagnostics();
            await RunConnectionTestAsync();
        };
    }

    private void PopulateDiagnostics()
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("=== DAXABITHMS CLIENT DIAGNOSTICS ===");
        sb.AppendLine($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine("Application: DaxabitHMS v1.0.5");
        sb.AppendLine();
        sb.AppendLine("[Operating System & Hardware]");
        sb.AppendLine($"OS Version: {Environment.OSVersion}");
        sb.AppendLine($"64-Bit OS: {Environment.Is64BitOperatingSystem}");
        sb.AppendLine($"64-Bit Process: {Environment.Is64BitProcess}");
        sb.AppendLine($"Machine Name: {Environment.MachineName}");
        sb.AppendLine($"User Domain: {Environment.UserDomainName}");
        sb.AppendLine($"Logical Processors: {Environment.ProcessorCount}");
        sb.AppendLine($"System Page Size: {Environment.SystemPageSize} bytes");
        sb.AppendLine($"DPI Scale Factor: {DeviceDpi / 96.0:P0} ({DeviceDpi} DPI)");
        sb.AppendLine();
        sb.AppendLine("[Application Configuration]");
        sb.AppendLine($"Operating Mode: {_config.Mode ?? "Unconfigured"}");
        sb.AppendLine($"Configured Server URL: {_config.ServerUrl ?? "None"}");
        sb.AppendLine($"Config Directory: {AppConfig.ConfigDir}");
        sb.AppendLine($"Config File Exists: {File.Exists(AppConfig.ConfigPath)}");
        sb.AppendLine($"Data Directory: {ServerPaths.DataDir}");
        sb.AppendLine($"Uploads Directory: {ServerPaths.UploadsDir}");
        sb.AppendLine($"Logs Directory: {ServerPaths.ServerLogDir}");
        sb.AppendLine();
        sb.AppendLine("[Runtime Components]");
        sb.AppendLine($"App Base Directory: {AppContext.BaseDirectory}");
        sb.AppendLine($".NET Runtime: {Environment.Version}");
        try
        {
            var webviewVer = CoreWebView2Environment.GetAvailableBrowserVersionString();
            sb.AppendLine($"WebView2 Runtime Version: {webviewVer}");
        }
        catch
        {
            sb.AppendLine("WebView2 Runtime Version: NOT DETECTED");
        }
        if (_config.IsEmbedded)
        {
            sb.AppendLine();
            sb.AppendLine("[Embedded Local Services]");
            sb.AppendLine($"Node.js Exe: {ServerPaths.NodeExePath} (Exists: {File.Exists(ServerPaths.NodeExePath)})");
            sb.AppendLine($"Postgres Bin: {ServerPaths.PostgresBinDir} (Exists: {Directory.Exists(ServerPaths.PostgresBinDir)})");
            sb.AppendLine($"Database Dir: {ServerPaths.PgDataDir} (Exists: {Directory.Exists(ServerPaths.PgDataDir)})");
            sb.AppendLine($"Backend Config: {ServerPaths.BackendEnvPath} (Exists: {File.Exists(ServerPaths.BackendEnvPath)})");
        }

        _detailsBox.Text = sb.ToString();
    }

    private async Task RunConnectionTestAsync()
    {
        if (string.IsNullOrWhiteSpace(_config.ServerUrl))
        {
            _pingStatusLabel.Text = "No server URL configured.";
            _pingStatusLabel.ForeColor = Color.DarkOrange;
            return;
        }

        _pingStatusLabel.Text = $"Testing connection to {_config.ServerUrl}...";
        _pingStatusLabel.ForeColor = SystemColors.GrayText;

        var sw = Stopwatch.StartNew();
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        var (ok, message) = await AppConfig.TestConnectionAsync(_config.ServerUrl, cts.Token);
        sw.Stop();

        if (ok)
        {
            _pingStatusLabel.Text = $"✓ Server Online ({sw.ElapsedMilliseconds} ms latency)";
            _pingStatusLabel.ForeColor = Color.DarkGreen;
        }
        else
        {
            _pingStatusLabel.Text = $"✕ Connection Failed: {message}";
            _pingStatusLabel.ForeColor = Color.Red;
        }
    }
}

