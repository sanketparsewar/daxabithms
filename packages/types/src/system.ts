export interface ServerVersionInfo {
  serverVersion: string;
  minDesktopVersion: string;
  minApiVersion: string;
  recommendedDesktopVersion: string;
  databaseSchemaVersion: string;
  environment: string;
  releaseNotesUrl?: string;
  buildTimestamp?: string;
}

export interface ClientCompatibilityRequest {
  clientType: 'DESKTOP' | 'WEB' | 'TABLET' | 'MOBILE';
  clientVersion: string;
}

export interface ClientCompatibilityResponse {
  compatible: boolean;
  serverVersion: string;
  clientVersion: string;
  minRequiredVersion: string;
  message: string;
  isMandatoryUpgrade: boolean;
  downloadUrl?: string;
}

export interface ActiveBillingStatus {
  safeToUpdate: boolean;
  activeOrdersCount: number;
  unsettledTablesCount: number;
  recentActivityCount: number;
  warning?: string;
}

export interface UpdateArtifact {
  platform: 'windows-installer' | 'windows-msix' | 'linux-docker';
  url: string;
  sha256: string;
  signature?: string;
  sizeBytes?: number;
}

export interface ReleaseNoteItem {
  type: 'feature' | 'fix' | 'security' | 'migration';
  description: string;
}

export interface UpdateManifest {
  version: string;
  releaseDate: string;
  minDesktopVersion: string;
  isMandatory: boolean;
  releaseNotes: ReleaseNoteItem[];
  artifacts: Record<string, UpdateArtifact>;
  databaseMigrationsRequired: boolean;
  targetSchemaVersion?: string;
}

export interface UpdateStatus {
  state:
    | 'idle'
    | 'checking'
    | 'downloading'
    | 'backing_up'
    | 'migrating'
    | 'restarting'
    | 'done'
    | 'rolled_back'
    | 'error';
  step?: string | null;
  progressPercent?: number;
  version?: string | null;
  error?: string | null;
  preUpdateBackupId?: string | null;
  timestamp?: string;
}

export interface UpdateLogEntry {
  id: string;
  timestamp: string;
  fromVersion: string;
  toVersion: string;
  status: 'SUCCESS' | 'ROLLED_BACK' | 'FAILED';
  preUpdateBackupPath?: string;
  errorDetails?: string;
  initiatedBy?: string;
}

