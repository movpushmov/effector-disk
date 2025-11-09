import { mkdir } from 'fs/promises';
import multer from 'multer';
import { basename, dirname, extname } from 'path';
import sharp from 'sharp';
import ffmpeg from 'ffmpeg';

export const UPLOAD_DIR = './uploads';
export const THUMBNAILS_DIR = './thumbnails';

await mkdir(UPLOAD_DIR, { recursive: true });
await mkdir(THUMBNAILS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

export async function generateImageThumbnail(
  filePath: string,
  thumbnailPath: string,
) {
  await sharp(filePath)
    .resize(200, 200, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);
}

export async function generateVideoThumbnail(
  filePath: string,
  thumbnailPath: string,
) {
  const video = await new ffmpeg(filePath);

  return video
    .fnExtractFrameToJPG(dirname(thumbnailPath), {
      start_time: 1,
      size: '200x200',
      file_name: basename(thumbnailPath),
    })
    .then(([file]) => file);
}
