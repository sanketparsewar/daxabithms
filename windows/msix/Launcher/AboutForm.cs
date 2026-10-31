namespace DaxabitHMS.Launcher;

internal sealed class AboutForm : Form
{
    public AboutForm(AppConfig config)
    {
        Text = "About DaxabitHMS";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterParent;
        MaximizeBox = false;
        MinimizeBox = false;
        ClientSize = new Size(460, 320);
        ShowInTaskbar = false;

        var iconBox = new PictureBox
        {
            Image = Icon?.ToBitmap() ?? SystemIcons.Application.ToBitmap(),
            SizeMode = PictureBoxSizeMode.Zoom,
            Location = new Point(24, 24),
            Size = new Size(64, 64),
        };

        var titleLabel = new Label
        {
            Text = "DaxabitHMS",
            Font = new Font("Segoe UI", 16f, FontStyle.Bold),
            Location = new Point(104, 24),
            Size = new Size(330, 32),
        };

        var versionLabel = new Label
        {
            Text = "Version 1.0.5 (Build 2026.10.31)",
            Font = new Font("Segoe UI", 9.5f),
            ForeColor = SystemColors.GrayText,
            Location = new Point(104, 58),
            Size = new Size(330, 20),
        };

        var descLabel = new Label
        {
            Text = "Restaurant & Hotel Management System\nPoint of Sale (POS) • Kitchen Display • Inventory • GST/VAT Billing",
            Font = new Font("Segoe UI", 9.5f),
            Location = new Point(24, 104),
            Size = new Size(410, 38),
        };

        var modeText = config.IsEmbedded ? "Local Embedded Server (Port 1995)" : $"Remote Client ({config.ServerUrl})";
        var infoBox = new GroupBox
        {
            Text = "Deployment Details",
            Font = new Font("Segoe UI", 9f),
            Location = new Point(24, 150),
            Size = new Size(412, 100),
        };

        var modeLabel = new Label
        {
            Text = $"Operating Mode: {modeText}\nData Location: {ServerPaths.DataDir}\nLicense: GNU AGPLv3 (Free & Open Source)",
            Font = new Font("Segoe UI", 8.5f),
            Location = new Point(12, 22),
            Size = new Size(388, 68),
        };
        infoBox.Controls.Add(modeLabel);

        var closeBtn = new Button
        {
            Text = "OK",
            DialogResult = DialogResult.OK,
            Location = new Point(340, 268),
            Size = new Size(96, 32),
        };
        AcceptButton = closeBtn;

        Controls.Add(iconBox);
        Controls.Add(titleLabel);
        Controls.Add(versionLabel);
        Controls.Add(descLabel);
        Controls.Add(infoBox);
        Controls.Add(closeBtn);
    }
}

