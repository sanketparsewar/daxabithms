using System.Net.Http;
using System.Text.Json;

namespace DaxabitHMS.Launcher;

/// <summary>
/// Per-user configuration for the local desktop installation. Stored under
/// %LOCALAPPDATA%\DaxabitHMS, NOT inside the MSIX
/// install directory (which is read-only after install and not guaranteed
/// writable/stable across updates — see hardening brief section 19).
/// </summary>
internal sealed class AppConfig
{
    public string? ServerUrl { get; set; }

    // Desktop-only mode. ServerUrl is always loopback and never user-editable.
    public string? Mode { get; set; }

    public bool IsEmbedded => Mode == "embedded";

    // internal, not private: MainForm's "Remove All Local Data & Uninstall"
    // action deletes this whole tree as the single root of everything this
    // app ever writes (config, WebView2 profile, logs, and ServerPaths.
    // DataDir underneath it) — see that method's own comment for why MSIX
    // needs this at all (no uninstall-hook mechanism to do it automatically).
    internal static string ConfigDir =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "DaxabitHMS");

    public static string ConfigPath => Path.Combine(ConfigDir, "config.json");

    internal static string MachineConfigDir =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "DaxabitHMS");

    public static string MachineConfigPath => Path.Combine(MachineConfigDir, "config.json");

    public static string WebView2UserDataFolder => Path.Combine(ConfigDir, "WebView2");

    public static string LogDir => Path.Combine(ConfigDir, "logs");

    public static AppConfig Load()
    {
        try
        {
            if (File.Exists(ConfigPath))
            {
                var json = File.ReadAllText(ConfigPath);
                var cfg = JsonSerializer.Deserialize<AppConfig>(json);
                if (cfg is not null) return cfg;
            }
            if (File.Exists(MachineConfigPath))
            {
                var json = File.ReadAllText(MachineConfigPath);
                var cfg = JsonSerializer.Deserialize<AppConfig>(json);
                if (cfg is not null) return cfg;
            }
        }
        catch
        {
            // Corrupt/unreadable config — fall through to first-run defaults
            // rather than crashing the app on launch.
        }
        return new AppConfig();
    }

    public void Save()
    {
        Directory.CreateDirectory(ConfigDir);
        var json = JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(ConfigPath, json);
    }

    /// <summary>
    /// Checks the bundled local service health endpoint.
    /// </summary>
    public static async Task<(bool Ok, string Message)> TestConnectionAsync(string serverUrl, CancellationToken ct)
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(6) };
            using var response = await client.GetAsync($"{serverUrl}/api/health", ct);
            if (response.IsSuccessStatusCode) return (true, "Connected.");
            return (false, $"The local DaxabitHMS service returned HTTP {(int)response.StatusCode}.");
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            return (false, "The local service didn't respond in time.");
        }
        catch (OperationCanceledException)
        {
            return (false, "Cancelled.");
        }
        catch (HttpRequestException ex)
        {
            return (false, $"Could not reach the local service.\n\n({ex.Message})");
        }
        catch (Exception ex)
        {
            return (false, $"Could not connect: {ex.Message}");
        }
    }
}
