import {
  DeleteFileSuccessSchema,
  GetFilesSuccessSchema,
  RenameFileSuccessSchema,
  UploadFileSuccessSchema,
  type SignInRequest,
  type SignInSuccess,
  type GetFilesSuccess,
  type UploadFileSuccess,
  type RenameFileRequest,
  type RenameFileSuccess,
  type DeleteFileRequest,
  type DeleteFileSuccess,
  type UploadFileOptions,
  SignInSuccessSchema,
  type SignInProblemKind,
  type GetFilesProblemKind,
  type UploadProblemKind,
  type DeleteProblemKind,
  type RenameProblemKind,
  type ClientProblemKind,
  type Result,
  type Profile,
  ProfileSchema,
  type GetFilesRequest,
  type CreateDirectoryRequest,
  type CreateDirectorySuccess,
  CreateDirectorySuccessSchema,
  CreateDirectoryProblemKind,
  type UploadFilesOptions,
} from '@shared/api';
import type { ZodObject } from 'zod';
import wretch from 'wretch';
import { WretchError } from 'wretch/resolver';
import QueryStringAddon from 'wretch/addons/queryString';

export class DiskApiClient {
  private client;
  private baseUrl: string;
  private token: string | undefined;

  constructor(baseUrl: string = 'http://localhost:5173/api') {
    this.baseUrl = baseUrl;
    this.client = this.createClient(baseUrl);
  }

  private createClient(baseUrl: string) {
    return wretch(baseUrl).addon(QueryStringAddon).headers({
      'Content-Type': 'application/json',
    });
  }

  public setAuthToken(token: string) {
    this.token = token;
    this.client = this.client.headers({
      cookie: `Authorization=${this.token}`,
    });
  }

  public clearAuthToken() {
    this.token = undefined;
    this.client = this.createClient(this.baseUrl);
  }

  public setHeaders(headers: Record<string, string>) {
    this.client = this.client.headers(headers);
  }

  public setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.client = this.createClient(baseUrl);
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      query?: string | object;
      schema?: ZodObject;
    } = {},
  ): Promise<T> {
    const { method = 'GET', body, query = {}, schema } = options;

    try {
      let request;

      // Настраиваем метод запроса
      switch (method) {
        case 'POST':
          request = this.client.query(query).url(endpoint).post(body);
          break;
        case 'PUT':
          request = this.client.query(query).url(endpoint).put(body);
          break;
        case 'DELETE':
          request = this.client.query(query).url(endpoint).delete();
          break;
        default:
          request = this.client.query(query).url(endpoint).get();
      }

      const response = await request.json();

      // Если есть kind в ответе - это ошибка
      if (response && typeof response === 'object' && 'kind' in response) {
        throw response.kind;
      }

      // Валидация успешного ответа
      if (schema) {
        return schema.parse(response) as T;
      }

      return response as T;
    } catch (error) {
      console.error('Cannot parse response', error);
      if (error instanceof WretchError) {
        const response = await error.response.json();

        if ('kind' in response) {
          throw response.kind;
        }
      }

      throw 'NETWORK_ERROR';
    }
  }

  async signIn(
    data: SignInRequest,
  ): Promise<Result<SignInSuccess, SignInProblemKind | ClientProblemKind>> {
    try {
      const response = await this.request<SignInSuccess>('/sign-in', {
        method: 'POST',
        body: data,
        schema: SignInSuccessSchema,
      });
      return { ok: true, data: response };
    } catch (error) {
      if (typeof error === 'string') {
        return { ok: false, error: error as SignInProblemKind };
      }
      return { ok: false, error: 'NETWORK_ERROR' };
    }
  }

  async getProfile(): Promise<Result<Profile, ClientProblemKind>> {
    try {
      const response = await this.request<Profile>('/profile', {
        method: 'GET',
        schema: ProfileSchema,
      });
      return { ok: true, data: response };
    } catch (error) {
      if (typeof error === 'string') {
        return { ok: false, error: error as ClientProblemKind };
      }
      return { ok: false, error: 'NETWORK_ERROR' };
    }
  }

  async getFiles(
    params: GetFilesRequest,
  ): Promise<Result<GetFilesSuccess, GetFilesProblemKind | ClientProblemKind>> {
    try {
      const response = await this.request<GetFilesSuccess>('/get-files', {
        method: 'GET',
        query: params.path ? params : '',
        schema: GetFilesSuccessSchema,
      });

      return { ok: true, data: response };
    } catch (error) {
      console.error(error);
      if (typeof error === 'string') {
        return { ok: false, error: error as GetFilesProblemKind };
      }
      return { ok: false, error: 'NETWORK_ERROR' };
    }
  }

  async uploadFile(
    options: UploadFileOptions,
  ): Promise<Result<UploadFileSuccess, UploadProblemKind | ClientProblemKind>> {
    const { file, onProgress } = options;

    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Прогресс загрузки
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            onProgress(percent, event.loaded, event.total);
          }
        };
      }

      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            const parsed = UploadFileSuccessSchema.parse(response);
            resolve({ ok: true, data: parsed });
          } catch (parseError) {
            console.error('Parse error:', parseError);
            resolve({ ok: false, error: 'PARSE_ERROR' });
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({ ok: false, error: response.kind || 'UPLOAD_FAILED' });
          } catch {
            resolve({ ok: false, error: 'NETWORK_ERROR' });
          }
        }
      };

      xhr.onerror = function () {
        resolve({ ok: false, error: 'NETWORK_ERROR' });
      };

      xhr.ontimeout = function () {
        resolve({ ok: false, error: 'NETWORK_ERROR' });
      };

      xhr.onabort = function () {
        resolve({ ok: false, error: 'UPLOAD_ABORTED' });
      };

      // Явно указываем таймауты
      xhr.timeout = 300000; // 5 минут

      xhr.open(
        'POST',
        `${this.baseUrl}/upload-file` +
          (options.path !== null
            ? `?path=${encodeURIComponent(options.path)}`
            : ''),
      );

      xhr.send(formData);
    });
  }

  async createDirectory(
    params: CreateDirectoryRequest,
  ): Promise<
    Result<
      CreateDirectorySuccess,
      CreateDirectoryProblemKind | ClientProblemKind
    >
  > {
    try {
      const response = await this.request<CreateDirectorySuccess>(
        '/create-directory',
        {
          method: 'POST',
          body: params,
          schema: CreateDirectorySuccessSchema,
        },
      );
      return { ok: true, data: response };
    } catch (error) {
      if (typeof error === 'string') {
        return { ok: false, error: error as CreateDirectoryProblemKind };
      }
      return { ok: false, error: 'NETWORK_ERROR' };
    }
  }

  async uploadFiles({
    files,
    path,
    onProgress,
  }: UploadFilesOptions): Promise<
    Result<UploadFileSuccess, UploadProblemKind | ClientProblemKind>[]
  > {
    const uploadPromises = files.map((file, index) =>
      this.uploadFile({
        file,
        path,
        onProgress: onProgress
          ? (progress: number) => onProgress(index, progress)
          : undefined,
      }),
    );

    return Promise.all(uploadPromises);
  }

  async deleteFile(
    data: DeleteFileRequest,
  ): Promise<Result<DeleteFileSuccess, DeleteProblemKind | ClientProblemKind>> {
    try {
      const response = await this.request<DeleteFileSuccess>('/delete-file', {
        method: 'DELETE',
        query: data,
        schema: DeleteFileSuccessSchema,
      });
      return { ok: true, data: response };
    } catch (error) {
      if (typeof error === 'string') {
        return { ok: false, error: error as DeleteProblemKind };
      }
      return { ok: false, error: 'NETWORK_ERROR' };
    }
  }

  async renameFile(
    data: RenameFileRequest,
  ): Promise<Result<RenameFileSuccess, RenameProblemKind | ClientProblemKind>> {
    try {
      const response = await this.request<RenameFileSuccess>('/rename-file', {
        method: 'PUT',
        body: data,
        schema: RenameFileSuccessSchema,
      });
      return { ok: true, data: response };
    } catch (error) {
      if (typeof error === 'string') {
        return { ok: false, error: error as RenameProblemKind };
      }
      return { ok: false, error: 'NETWORK_ERROR' };
    }
  }

  getThumbnailUrl(fileId: string): string {
    return `${this.baseUrl}/thumbnail/${fileId}`;
  }

  getPreviewUrl(fileId: string): string {
    return `${this.baseUrl}/preview/${fileId}`;
  }

  getDownloadUrl(fileId: string): string {
    return `${this.baseUrl}/download/${fileId}`;
  }

  subscribeToUploadProgress(
    uploadId: string,
    onProgress: (progress: number) => void,
    onError?: (kind: ClientProblemKind) => void,
    onComplete?: () => void,
  ): () => void {
    const eventSource = new EventSource(
      `${this.baseUrl}/upload-progress/${uploadId}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onProgress(data.progress);

        if (data.progress >= 100) {
          eventSource.close();
          onComplete?.();
        }
      } catch {
        onError?.('PARSE_ERROR');
      }
    };

    eventSource.onerror = () => {
      onError?.('NETWORK_ERROR');
      eventSource.close();
    };

    return () => eventSource.close();
  }
}
