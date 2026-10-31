#Requires -Version 5.1
<#
.SYNOPSIS
  DaxabitHMS Server Initializer & Migration Tool.
  Called during installer execution to safely provision PostgreSQL, generate secure secrets,
  and apply database migrations.
#>

param(
    [string]$InstallDir = "$PSScriptRoot\..",
    [string]$DataDir = "$env:ProgramData\DaxabitHMS\server"
)

$ErrorActionPreference = 'Stop'

$PostgresPort = 55432
$ServerDir = Join-Path $InstallDir 'server'
$NodeExe = Join-Path $ServerDir 'node\node.exe'
$PgBinDir = Join-Path $ServerDir 'postgres\bin'
$InitDb = Join-Path $PgBinDir 'initdb.exe'
$PgCtl = Join-Path $PgBinDir 'pg_ctl.exe'
$CreateDb = Join-Path $PgBinDir 'createdb.exe'
$BackendDir = Join-Path $ServerDir 'backend'

$PgDataDir = Join-Path $DataDir 'pgdata'
$UploadsDir = Join-Path $DataDir 'uploads'
$LogDir = Join-Path $DataDir 'logs'
$BackendEnvPath = Join-Path $DataDir 'backend.env'
$PgPasswordFilePath = Join-Path $DataDir 'pg-password.txt'

# 1. Create directories
New-Item -ItemType Directory -Force -Path $DataDir, $PgDataDir, $UploadsDir, $LogDir | Out-Null

$LogFile = Join-Path $LogDir 'installer-setup.log'
function Log-Info([string]$msg) {
    $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $line = "[$ts] $msg"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

Log-Info "=== DaxabitHMS Server Setup Started ==="
Log-Info "InstallDir: $InstallDir"
Log-Info "DataDir: $DataDir"

function Generate-SecureSecret([int]$length) {
    $bytes = New-Object byte[] $length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#%^&*()-_=+"
    $sb = New-Object System.Text.StringBuilder
    for ($i = 0; $i -lt $length; $i++) {
        $idx = $bytes[$i] % $chars.Length
        [void]$sb.Append($chars[$idx])
    }
    return $sb.ToString()
}

function Generate-HexSecret([int]$byteCount) {
    $bytes = New-Object byte[] $byteCount
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return -join ($bytes | ForEach-Object { $_.ToString("x2") })
}

$isFreshDb = -not (Test-Path (Join-Path $PgDataDir 'PG_VERSION'))

if ($isFreshDb) {
    Log-Info "Fresh database installation detected. Initializing PostgreSQL cluster..."
    $dbPassword = Generate-SecureSecret 32
    Set-Content -Path $PgPasswordFilePath -Value $dbPassword -Encoding ASCII

    # Restrict ACL on password file to Administrators & SYSTEM only
    try {
        $acl = Get-Acl $PgPasswordFilePath
        $acl.SetAccessRuleProtection($true, $false)
        $adminRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Administrators", "FullControl", "Allow")
        $systemRule = New-Object System.Security.AccessControl.FileSystemAccessRule("SYSTEM", "FullControl", "Allow")
        $acl.AddAccessRule($adminRule)
        $acl.AddAccessRule($systemRule)
        Set-Acl -Path $PgPasswordFilePath -AclObject $acl
    } catch {
        Log-Info "Notice: Could not tighten ACL on $PgPasswordFilePath: $($_.Exception.Message)"
    }

    $initArgs = "-D `"$PgDataDir`" -U daxabit_admin -A scram-sha-256 -E UTF8 --pwfile=`"$PgPasswordFilePath`""
    $proc = Start-Process -FilePath $InitDb -ArgumentList $initArgs -WorkingDirectory $PgBinDir -NoNewWindow -Wait -PassThru
    if ($proc.ExitCode -ne 0) {
        Log-Info "FATAL: initdb failed with exit code $($proc.ExitCode)"
        exit $proc.ExitCode
    }
    Log-Info "PostgreSQL cluster initialized."

    # Configure postgresql.conf for local port
    $pgConf = Join-Path $PgDataDir 'postgresql.conf'
    Add-Content -Path $pgConf -Value "`nport = $PostgresPort`nlisten_addresses = '127.0.0.1'`nmax_connections = 100`n"

    # Start temporary Postgres for database creation
    Log-Info "Starting temporary PostgreSQL instance on port $PostgresPort..."
    $pgLog = Join-Path $LogDir 'temp-postgres.log'
    Start-Process -FilePath $PgCtl -ArgumentList "start -D `"$PgDataDir`" -l `"$pgLog`" -w -t 60" -WorkingDirectory $PgBinDir -NoNewWindow -Wait

    # Create daxabithms database
    Log-Info "Creating database 'daxabithms'..."
    $env:PGPASSWORD = $dbPassword
    Start-Process -FilePath $CreateDb -ArgumentList "-h 127.0.0.1 -p $PostgresPort -U daxabit_admin daxabithms" -WorkingDirectory $PgBinDir -NoNewWindow -Wait
    $env:PGPASSWORD = $null

    # Generate secrets for backend.env
    $jwtSecret = Generate-SecureSecret 64
    $encryptionKey = Generate-HexSecret 32
    $encodedPassword = [System.Uri]::EscapeDataString($dbPassword)

    $envContent = @"
DATABASE_URL="postgresql://daxabit_admin:$encodedPassword@127.0.0.1:$PostgresPort/daxabithms?schema=public"
JWT_SECRET="$jwtSecret"
ENCRYPTION_KEY="$encryptionKey"
BACKUP_ENCRYPTION_KEY="$encryptionKey"
NODE_ENV="production"
PORT=4001
CORS_ORIGIN="http://localhost:1995"
UPLOAD_DIR="$UploadsDir"
"@
    Set-Content -Path $BackendEnvPath -Value $envContent -Encoding UTF8
    Log-Info "Created backend.env with production secrets."
} else {
    Log-Info "Existing database found at $PgDataDir. Preserving existing data and credentials."
    # Start temporary Postgres for migrations
    $pgLog = Join-Path $LogDir 'temp-postgres.log'
    Start-Process -FilePath $PgCtl -ArgumentList "start -D `"$PgDataDir`" -l `"$pgLog`" -w -t 60" -WorkingDirectory $PgBinDir -NoNewWindow -Wait
}

# Run Prisma database migrations
Log-Info "Applying Prisma database migrations..."
$prismaCli = Join-Path $BackendDir 'node_modules\prisma\build\index.js'
$schemaPath = Join-Path $BackendDir 'prisma\schema.prisma'

# Read DATABASE_URL from backend.env
$dbUrl = ""
Get-Content $BackendEnvPath | ForEach-Object {
    if ($_ -match '^DATABASE_URL="?([^"]+)"?') {
        $dbUrl = $matches[1]
    }
}

if (-not $dbUrl) {
    Log-Info "FATAL: Could not read DATABASE_URL from $BackendEnvPath"
    Start-Process -FilePath $PgCtl -ArgumentList "stop -D `"$PgDataDir`" -m fast -w" -WorkingDirectory $PgBinDir -NoNewWindow -Wait
    exit 1
}

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $NodeExe
$psi.Arguments = "`"$prismaCli`" migrate deploy --schema=`"$schemaPath`""
$psi.WorkingDirectory = $BackendDir
$psi.UseShellExecute = $false
$psi.EnvironmentVariables["DATABASE_URL"] = $dbUrl
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($psi)
$stdout = $proc.StandardOutput.ReadToEnd()
$stderr = $proc.StandardError.ReadToEnd()
$proc.WaitForExit()

Add-Content -Path $LogFile -Value "Prisma Output: $stdout"
if ($stderr) { Add-Content -Path $LogFile -Value "Prisma Stderr: $stderr" }

if ($proc.ExitCode -ne 0) {
    Log-Info "FATAL: Prisma migration failed with exit code $($proc.ExitCode)"
    Start-Process -FilePath $PgCtl -ArgumentList "stop -D `"$PgDataDir`" -m fast -w" -WorkingDirectory $PgBinDir -NoNewWindow -Wait
    exit $proc.ExitCode
}
Log-Info "Prisma migrations applied successfully."

# Stop temporary PostgreSQL instance cleanly
Log-Info "Stopping temporary PostgreSQL instance..."
Start-Process -FilePath $PgCtl -ArgumentList "stop -D `"$PgDataDir`" -m fast -w" -WorkingDirectory $PgBinDir -NoNewWindow -Wait

# Configure Windows Firewall rule for inbound port 1995
try {
    Log-Info "Configuring Windows Firewall inbound rule for port 1995..."
    & netsh advfirewall firewall delete rule name="DaxabitHMS POS Server" 2>$null | Out-Null
    & netsh advfirewall firewall add rule name="DaxabitHMS POS Server" dir=in action=allow protocol=TCP localport=1995 profile=private,domain | Out-Null
    Log-Info "Firewall rule created for port 1995."
} catch {
    Log-Info "Warning: Firewall rule configuration error: $($_.Exception.Message)"
}

# Write machine-wide config.json
$machineConfigDir = "$env:ProgramData\DaxabitHMS"
New-Item -ItemType Directory -Force -Path $machineConfigDir | Out-Null
$configJson = @"
{
  "ServerUrl": "http://localhost:1995",
  "Mode": "embedded"
}
"@
Set-Content -Path (Join-Path $machineConfigDir 'config.json') -Value $configJson -Encoding UTF8

Log-Info "=== DaxabitHMS Server Setup Completed Successfully ==="
exit 0
