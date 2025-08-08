import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export class ThumbnailGenerator {
  private static readonly THUMBNAIL_DIR = path.join(app.getPath('userData'), 'thumbnails');
  private static readonly THUMBNAIL_SIZE = '320x180';
  private static readonly SEEK_TIME = '00:00:10'; // Seek to 10 seconds

  static async ensureThumbnailDir(): Promise<void> {
    try {
      await fs.access(this.THUMBNAIL_DIR);
    } catch {
      await fs.mkdir(this.THUMBNAIL_DIR, { recursive: true });
    }
  }

  static async generateThumbnail(videoPath: string, videoName: string): Promise<string | null> {
    try {
      await this.ensureThumbnailDir();
      
      // Create thumbnail filename
      const thumbnailName = `${videoName}_thumb.jpg`;
      const thumbnailPath = path.join(this.THUMBNAIL_DIR, thumbnailName);
      
      // Check if thumbnail already exists
      try {
        await fs.access(thumbnailPath);
        return thumbnailPath; // Return existing thumbnail
      } catch {
        // Thumbnail doesn't exist, generate it
      }

      // Check if source video exists
      try {
        await fs.access(videoPath);
      } catch {
        console.warn(`[ThumbnailGenerator] Video file not found: ${videoPath}`);
        return null;
      }

      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(this.SEEK_TIME)
          .frames(1)
          .size(this.THUMBNAIL_SIZE)
          .format('image2')
          .on('end', () => {
            console.log(`[ThumbnailGenerator] Thumbnail generated: ${thumbnailPath}`);
            resolve(thumbnailPath);
          })
          .on('error', (err) => {
            console.error(`[ThumbnailGenerator] Error generating thumbnail for ${videoPath}:`, err);
            reject(err);
          })
          .save(thumbnailPath);
      });
    } catch (error) {
      console.error(`[ThumbnailGenerator] Error generating thumbnail:`, error);
      return null;
    }
  }

  static async getThumbnailPath(videoName: string): Promise<string | null> {
    try {
      const thumbnailName = `${videoName}_thumb.jpg`;
      const thumbnailPath = path.join(this.THUMBNAIL_DIR, thumbnailName);
      
      await fs.access(thumbnailPath);
      return thumbnailPath;
    } catch {
      return null;
    }
  }

  static async cleanupThumbnails(): Promise<void> {
    try {
      const files = await fs.readdir(this.THUMBNAIL_DIR);
      const cleanupPromises = files.map(file => 
        fs.unlink(path.join(this.THUMBNAIL_DIR, file)).catch(() => {})
      );
      await Promise.all(cleanupPromises);
      console.log('[ThumbnailGenerator] Cleaned up thumbnails directory');
    } catch (error) {
      console.error('[ThumbnailGenerator] Error cleaning up thumbnails:', error);
    }
  }
}
