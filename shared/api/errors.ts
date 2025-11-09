export const SignInProblemKind = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
} as const;

export const GetFilesProblemKind = {
  DIR_NOT_FOUND: 'DIR_NOT_FOUND',
  NOT_A_DIR: 'NOT_A_DIR',
} as const;

export const UploadProblemKind = {
  NO_FILE: 'NO_FILE',
  INVALID_TARGET: 'INVALID_TARGET',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
} as const;

export const DeleteProblemKind = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
} as const;

export const RenameProblemKind = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_NAME: 'INVALID_NAME',
} as const;

export const ThumbnailProblemKind = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  THUMBNAIL_NOT_FOUND: 'THUMBNAIL_NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export const DownloadProblemKind = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
} as const;

export const CreateDirectoryProblemKind = {
  TARGET_NOT_FOUND: 'TARGET_NOT_FOUND',
  WRONG_TARGET: 'WRONG_TARGET',
} as const;

export const PreviewProblemKind = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  NOT_A_FILE: 'NOT_A_FILE',
};

// Client-only error kinds (не приходят с бэкенда)
export const ClientProblemKind = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UPLOAD_ABORTED: 'UPLOAD_ABORTED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type SignInProblemKind =
  (typeof SignInProblemKind)[keyof typeof SignInProblemKind];
export type GetFilesProblemKind =
  (typeof GetFilesProblemKind)[keyof typeof GetFilesProblemKind];
export type UploadProblemKind =
  (typeof UploadProblemKind)[keyof typeof UploadProblemKind];
export type DeleteProblemKind =
  (typeof DeleteProblemKind)[keyof typeof DeleteProblemKind];
export type RenameProblemKind =
  (typeof RenameProblemKind)[keyof typeof RenameProblemKind];
export type CreateDirectoryProblemKind =
  (typeof CreateDirectoryProblemKind)[keyof typeof CreateDirectoryProblemKind];
export type ThumbnailProblemKind =
  (typeof ThumbnailProblemKind)[keyof typeof ThumbnailProblemKind];
export type PreviewProblemKind =
  (typeof PreviewProblemKind)[keyof typeof PreviewProblemKind];
export type DownloadProblemKind =
  (typeof DownloadProblemKind)[keyof typeof DownloadProblemKind];
export type ClientProblemKind =
  (typeof ClientProblemKind)[keyof typeof ClientProblemKind];
