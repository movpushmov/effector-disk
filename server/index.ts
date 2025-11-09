/// <reference types="vite/types/importMeta.d.ts" />

import {
  ClientProblemKind,
  CreateDirectoryProblemKind,
  CreateDirectoryRequestSchema,
  DeleteFileRequestSchema,
  DeleteProblemKind,
  DownloadProblemKind,
  GetFilesProblemKind,
  GetFilesRequestSchema,
  PreviewProblemKind,
  RenameFileRequestSchema,
  RenameProblemKind,
  SignInProblemKind,
  SignInRequestSchema,
  ThumbnailProblemKind,
  UploadProblemKind,
} from '@shared/api';
import jwt from 'jsonwebtoken';
import { join, resolve } from 'path';
import { getViteDevServer } from '@server/libs/vite';
import { readFile, unlink } from 'fs/promises';
import { renderToPipeableStream } from 'react-dom/server';
import { ReactNode } from 'react';
import express, { NextFunction, Request, Response } from 'express';
import { Transform } from 'stream';
import { z } from 'zod';
import { v4 } from 'uuid';
import crypto from 'crypto';
import {
  generateImageThumbnail,
  generateVideoThumbnail,
  THUMBNAILS_DIR,
  upload,
  UPLOAD_DIR,
} from './libs/fs';
import { FileType, PrismaClient, User } from './libs/prisma/client';
import cookieParser from 'cookie-parser';

import 'dotenv/config';
import { FileModel } from './libs/prisma/models';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      JWT_SECRET: string;
    }
  }
}

const client = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const JWT_SECRET = process.env.JWT_SECRET;

const createSHA512Hash = (password: string): string => {
  return crypto.createHash('sha512').update(password).digest('hex');
};

const generateToken = (userId: string, username: string): string => {
  return jwt.sign(
    {
      userId,
      username,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: '1y' },
  );
};

const findFile = (ownerId: string, path?: string | null) => {
  if (!path) {
    return null;
  }

  return client.file.findFirst({
    where: {
      path,
      owner: {
        id: ownerId,
      },
    },
    include: {
      owner: true,
      parent: true,
    },
  });
};

async function getFileWithAllChildren(fileId: string, ownerId: string) {
  const files: FileModel[] = [];

  const getFileWithChildren = async (id: string) => {
    const file = await client.file.findUnique({
      where: { id, owner: { id: ownerId } },
      include: {
        children: true, // получаем только прямых потомков
      },
    });

    if (!file) return null;

    files.push(file);

    // Рекурсивно получаем детей для каждого ребенка
    if (file.children && file.children.length > 0) {
      const foundFiles = await Promise.all(
        file.children.map((child) => getFileWithChildren(child.id)),
      );

      files.push(...(foundFiles.filter(Boolean) as FileModel[]));
    }

    return file;
  };

  await getFileWithChildren(fileId);

  return files;
}

async function initializeRootUser() {
  const user = await client.user.findFirst({
    where: {
      username: 'movpushmov',
    },
  });

  if (user) {
    return;
  }

  await client.user.create({
    data: {
      username: 'movpushmov',
      password: createSHA512Hash('1234'),
    },
  });
}

async function bootstrap() {
  const app = express();

  await initializeRootUser();

  app.use(express.json());
  app.use(cookieParser());

  if (import.meta.env.DEV) {
    const vite = await getViteDevServer();

    app.use(vite.middlewares);
  }

  const apiRouter = express.Router();

  const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = req.cookies['Authorization'];

      if (!token) {
        res.status(401).json({ kind: ClientProblemKind.UNAUTHORIZED });
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      if (typeof decoded === 'string' || !('userId' in decoded)) {
        return res.status(401).json({ kind: ClientProblemKind.UNAUTHORIZED });
      }

      const user = await client.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        res.status(401).json({ kind: ClientProblemKind.UNAUTHORIZED });
        return;
      }

      req.user = user;
      next();
    } catch {
      res.status(401).json({ kind: ClientProblemKind.UNAUTHORIZED });
    }
  };

  apiRouter.post('/sign-in', async (req, res) => {
    try {
      const body = SignInRequestSchema.parse(req.body);
      const user = await client.user.findFirst({
        where: {
          username: body.username,
        },
      });

      if (!user) {
        return res
          .status(401)
          .json({ kind: SignInProblemKind.INVALID_CREDENTIALS });
      }

      if (createSHA512Hash(body.password) === user.password) {
        res.cookie('Authorization', generateToken(user.id, user.username), {
          // 1y
          maxAge: 12 * 31 * 24 * 60 * 60 * 1000,
        });
        return res.json({ success: true });
      } else {
        res.status(401).json({ kind: SignInProblemKind.INVALID_CREDENTIALS });
      }
    } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ kind: ClientProblemKind.INVALID_REQUEST });
      } else {
        res.status(500).json({ kind: ClientProblemKind.INTERNAL_SERVER_ERROR });
      }
    }
  });

  apiRouter.get('/get-files', authMiddleware, async (req, res) => {
    try {
      const body = GetFilesRequestSchema.parse(req.query);

      const currentFile = await findFile(req.user!.id, body.path);

      if (body.path && !currentFile) {
        return res
          .status(404)
          .json({ kind: GetFilesProblemKind.DIR_NOT_FOUND });
      }

      if (currentFile && currentFile.type !== FileType.DIR) {
        return res.status(400).json({ kind: GetFilesProblemKind.NOT_A_DIR });
      }

      const files = await client.file.findMany({
        where: {
          owner: {
            id: req.user!.id,
          },
          parent: currentFile ? { id: currentFile.id } : null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          owner: true,
          parent: true,
        },
      });

      res.json({
        files: files.map((file) => ({
          ...file,
          hasThumbnail: !!file.thumbnailPath,
        })),
        currentFile,
      });
    } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ kind: ClientProblemKind.INVALID_REQUEST });
      } else {
        res.status(500).json({ kind: ClientProblemKind.INTERNAL_SERVER_ERROR });
      }
    }
  });

  apiRouter.get('/profile', authMiddleware, (req, res) => {
    res.json({
      id: req.user?.id,
      username: req.user?.username,
    });
  });

  apiRouter.post('/create-directory', authMiddleware, async (req, res) => {
    try {
      const body = CreateDirectoryRequestSchema.parse(req.body);
      const target = await findFile(req.user!.id, body.path);

      if (body.path && !target) {
        return res
          .status(404)
          .json({ kind: CreateDirectoryProblemKind.TARGET_NOT_FOUND });
      }

      if (target && target.type === FileType.FILE) {
        return res
          .status(400)
          .json({ kind: CreateDirectoryProblemKind.WRONG_TARGET });
      }

      await client.file.create({
        data: {
          id: v4(),
          path: target ? join(target.path, body.name) : `/${body.name}`,
          filename: body.name,
          type: FileType.DIR,
          parent: target
            ? {
                connect: {
                  id: target?.id,
                },
              }
            : undefined,
          owner: {
            connect: {
              id: req.user!.id,
            },
          },
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ kind: ClientProblemKind.INVALID_REQUEST });
      } else {
        res.status(500).json({ kind: ClientProblemKind.INTERNAL_SERVER_ERROR });
      }
    }
  });

  apiRouter.post(
    '/upload-file',
    authMiddleware,
    upload.single('file'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ kind: UploadProblemKind.NO_FILE });
        }

        const { path } = req.query;

        if (path && typeof path !== 'string') {
          return res
            .status(400)
            .json({ kind: ClientProblemKind.INVALID_REQUEST });
        }

        const targetFile = await findFile(req.user!.id, path);

        if (path && !targetFile) {
          return res
            .status(404)
            .json({ kind: UploadProblemKind.INVALID_TARGET });
        }

        const file = req.file;
        const fileId = v4();

        const diskFilePath = join(UPLOAD_DIR, req.file.filename);

        let thumbnailPath = null;

        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');

        if (isImage || isVideo) {
          thumbnailPath = join(THUMBNAILS_DIR, `thumb-${fileId}.jpg`);

          try {
            if (isImage) {
              await generateImageThumbnail(diskFilePath, thumbnailPath);
            } else if (isVideo) {
              await generateVideoThumbnail(diskFilePath, thumbnailPath);
            }
          } catch (thumbError) {
            console.error('Thumbnail generation failed:', thumbError);
            thumbnailPath = null;
          }
        }

        const result = await client.file.create({
          data: {
            id: fileId,
            type: FileType.FILE,
            fsname: file.filename,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: targetFile
              ? join(targetFile.path, file.filename)
              : `/${file.filename}`,
            thumbnailPath,
            parent: targetFile
              ? {
                  connect: { id: targetFile.id },
                }
              : undefined,
            owner: {
              connect: { id: req.user!.id },
            },
          },
        });

        return res.json({
          file: {
            ...result,
            hasThumbnail: Boolean(result.thumbnailPath),
          },
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ kind: UploadProblemKind.UPLOAD_FAILED });
      }
    },
  );

  apiRouter.delete('/delete-file', authMiddleware, async (req, res) => {
    try {
      const body = DeleteFileRequestSchema.parse(req.query);
      const files = await getFileWithAllChildren(body.id, req.user!.id);

      if (!files.length) {
        return res.status(404).json({ kind: DeleteProblemKind.FILE_NOT_FOUND });
      }

      for (const file of files) {
        try {
          if (file.path) {
            await unlink(join(UPLOAD_DIR, file.filename!));
          }

          if (file.thumbnailPath) {
            await unlink(file.thumbnailPath);
          }
        } catch (fsError) {
          console.error('File deletion error:', fsError);
        }
      }

      await client.file.deleteMany({
        where: {
          OR: files.map((file) => ({ id: file.id })),
        },
      });

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ kind: ClientProblemKind.INVALID_REQUEST });
      } else {
        console.error(error);
        res.status(500).json({ kind: ClientProblemKind.INTERNAL_SERVER_ERROR });
      }
    }
  });

  apiRouter.put('/rename-file', authMiddleware, async (req, res) => {
    try {
      const body = RenameFileRequestSchema.parse(req.body);
      const file = await client.file.findFirst({
        where: { id: body.id, owner: { id: req.user!.id } },
        include: {
          owner: true,
        },
      });

      if (!file) {
        return res.status(404).json({ kind: RenameProblemKind.FILE_NOT_FOUND });
      }

      if (body.newName.trim().length === 0) {
        return res.status(400).json({ kind: RenameProblemKind.INVALID_NAME });
      }

      await client.file.update({
        where: { id: file.id },
        data: { filename: body.newName },
      });

      res.json({ newName: body.newName });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ kind: ClientProblemKind.INVALID_REQUEST });
      } else {
        console.error(error);
        res.status(500).json({ kind: ClientProblemKind.INTERNAL_SERVER_ERROR });
      }
    }
  });

  apiRouter.get('/thumbnail/:id', authMiddleware, async (req, res) => {
    try {
      const file = await client.file.findFirst({
        where: { id: req.params.id, owner: { id: req.user!.id } },
        include: {
          owner: true,
        },
      });

      if (!file || file.type === FileType.DIR) {
        return res
          .status(404)
          .json({ kind: ThumbnailProblemKind.FILE_NOT_FOUND });
      }

      if (!file.thumbnailPath) {
        return res
          .status(404)
          .json({ kind: ThumbnailProblemKind.THUMBNAIL_NOT_FOUND });
      }

      res.sendFile(resolve(file.thumbnailPath));
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ kind: ThumbnailProblemKind.INTERNAL_SERVER_ERROR });
    }
  });

  apiRouter.get('/preview/:id', authMiddleware, async (req, res) => {
    try {
      const file = await client.file.findFirst({
        where: { id: req.params.id, owner: { id: req.user!.id } },
        include: {
          owner: true,
        },
      });

      if (!file) {
        return res
          .status(404)
          .json({ kind: PreviewProblemKind.FILE_NOT_FOUND });
      }

      if (file.type === FileType.DIR) {
        return res.status(404).json({ kind: PreviewProblemKind.NOT_A_FILE });
      }

      res.sendFile(resolve(join(UPLOAD_DIR, file.fsname!)));
    } catch (error) {
      console.error(error);
      res.status(500).json({ kind: ClientProblemKind.INTERNAL_SERVER_ERROR });
    }
  });

  apiRouter.get('/download/:id', authMiddleware, async (req, res) => {
    try {
      const file = await client.file.findFirst({
        where: { id: req.params.id, owner: { id: req.user!.id } },
        include: {
          owner: true,
        },
      });

      if (!file || file.type === FileType.DIR) {
        return res
          .status(404)
          .json({ kind: DownloadProblemKind.FILE_NOT_FOUND });
      }

      res.download(join(UPLOAD_DIR, file.fsname!));
    } catch (error) {
      console.error(error);
      res.status(500).json({ kind: ClientProblemKind.INTERNAL_SERVER_ERROR });
    }
  });

  apiRouter.get('/upload-progress/:uploadId', authMiddleware, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      res.write(
        `data: ${JSON.stringify({ progress: Math.min(progress, 100) })}\n\n`,
      );

      if (progress >= 100) {
        clearInterval(interval);
        res.end();
      }
    }, 200);

    req.on('close', () => clearInterval(interval));
  });

  app.use('/api', apiRouter);

  app.use('*all', async (req, res) => {
    try {
      const url = req.originalUrl.replace(import.meta.env.BASE, '');

      type RenderResult = {
        app: ReactNode;
        data: {
          effector: unknown;
        };
      };

      type RenderConfig = {
        url: string;
        req: Request;
      };

      let template: string;
      let render: (config: RenderConfig) => Promise<RenderResult>;

      if (import.meta.env.PROD) {
        const rootDir = resolve(process.cwd(), 'build');
        const serverEntry = resolve(rootDir, 'server/entry-server.mjs');

        template = await readFile(
          resolve(rootDir, 'client/index.html'),
          'utf-8',
        );
        render = (await import(/* @vite-ignore */ serverEntry)).render;
      } else {
        const vite = await getViteDevServer();
        const rawTemplate = await readFile('index.html', 'utf-8');

        template = await vite.transformIndexHtml(url, rawTemplate);
        render = (await vite.ssrLoadModule('client/entry-server')).render;
      }

      const { app, data } = await render({ req, url });

      let didError = false;

      const { pipe, abort } = renderToPipeableStream(app, {
        onShellError() {
          res.status(500);
          res.set({ 'Content-Type': 'text/html' });
          res.send('<h1>Something went wrong</h1>');
        },
        onShellReady() {
          res.status(didError ? 500 : 200);
          res.set({ 'Content-Type': 'text/html' });

          const [htmlStart, htmlEnd] = template
            .replace(
              '<!-- effector-data -->',
              `<script>window.__EFFECTOR_DATA__ = ${JSON.stringify(data.effector)}</script>`,
            )
            .split('<!-- app -->');

          const transformStream = new Transform({
            transform(chunk, encoding, callback) {
              chunk = chunk.toString();
              res.write(chunk, encoding);

              callback();
            },
          });

          transformStream.on('finish', () => {
            res.write(htmlEnd, 'utf-8');
            res.end();
          });

          res.write(htmlStart);

          pipe(transformStream);
        },
        onError(error) {
          didError = true;
          console.error(error);
        },
      });

      setTimeout(() => {
        abort();
      }, 10_000);
    } catch (e) {
      const typedError = e as Error;

      if (import.meta.env.DEV) {
        const vite = await getViteDevServer();
        vite?.ssrFixStacktrace(typedError);
      }

      console.error(typedError.stack);
      res.status(500).end(typedError.stack);
    }
  });

  if (import.meta.env.PROD) {
    app.listen(8000);
  }

  return app;
}

export const app = bootstrap();
