import z from 'zod';

export type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

export const SignInRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const CreateDirectoryRequestSchema = z.object({
  path: z.nullable(z.string()),
  name: z.string(),
});

export const GetFilesRequestSchema = z.union([
  z.object({
    path: z
      .union([z.string(), z.undefined()])
      .transform((arg) => (arg ? decodeURIComponent(arg) : undefined)),
  }),
]);

export const RenameFileRequestSchema = z.object({
  id: z.uuidv4(),
  newName: z.string().min(1),
});

export const DeleteFileRequestSchema = z.object({
  id: z.uuidv4(),
});

export const CreateDirectorySuccessSchema = z.object({
  success: z.boolean(),
});

export const FileSchema = z.union([
  z.object({
    id: z.string(),
    type: z.literal('FILE'),
    path: z.string(),
    fsname: z.string(),
    filename: z.string(),
    mimetype: z.string(),
    size: z.number(),
    thumbnailPath: z.string().nullable(),
    createdAt: z.string(),
    hasThumbnail: z.boolean(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('DIR'),
    path: z.string(),
    filename: z.string(),
    createdAt: z.string(),
  }),
]);

export const SignInSuccessSchema = z.object({
  success: z.boolean(),
});

export const GetFilesSuccessSchema = z.object({
  files: z.array(FileSchema),
  currentFile: z.nullable(FileSchema),
});

export const UploadFileSuccessSchema = z.object({
  file: FileSchema,
});

export const RenameFileSuccessSchema = z.object({
  newName: z.string(),
});

export const DeleteFileSuccessSchema = z.object({
  success: z.literal(true),
});

export const ProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
});

export type SignInRequest = z.infer<typeof SignInRequestSchema>;
export type CreateDirectoryRequest = z.infer<
  typeof CreateDirectoryRequestSchema
>;
export type GetFilesRequest = z.infer<typeof GetFilesRequestSchema>;
export type RenameFileRequest = z.infer<typeof RenameFileRequestSchema>;
export type DeleteFileRequest = z.infer<typeof DeleteFileRequestSchema>;
export type FileInfo = z.infer<typeof FileSchema>;
export type SignInSuccess = z.infer<typeof SignInSuccessSchema>;
export type CreateDirectorySuccess = z.infer<
  typeof CreateDirectorySuccessSchema
>;
export type GetFilesSuccess = z.infer<typeof GetFilesSuccessSchema>;
export type UploadFileSuccess = z.infer<typeof UploadFileSuccessSchema>;
export type RenameFileSuccess = z.infer<typeof RenameFileSuccessSchema>;
export type DeleteFileSuccess = z.infer<typeof DeleteFileSuccessSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

export interface UploadProgressCallback {
  (progress: number, loaded: number, total: number): void;
}

export interface UploadFileOptions {
  file: File;
  path: string | null;
  onProgress?: UploadProgressCallback;
}

export interface UploadFilesOptions {
  files: File[];
  path: string | null;
  onProgress?: (fileIndex: number, progress: number) => void;
}
