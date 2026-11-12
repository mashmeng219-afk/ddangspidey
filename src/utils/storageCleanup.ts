import { ref, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Safely deletes any Firebase Storage files associated with a document (images, covers, media).
 * If the file does not exist or deletion fails, it silently continues without throwing.
 */
export async function deleteAttachedStorageFiles(item: {
  images?: string[];
  coverUrl?: string;
  coverPath?: string;
  audioPath?: string;
  audioUrl?: string;
  content?: string;
}): Promise<void> {
  const targets: string[] = [];

  if (item.coverPath) targets.push(item.coverPath);
  if (item.audioPath) targets.push(item.audioPath);

  if (item.coverUrl && item.coverUrl.includes('firebasestorage')) {
    targets.push(item.coverUrl);
  }
  if (item.audioUrl && item.audioUrl.includes('firebasestorage')) {
    targets.push(item.audioUrl);
  }

  if (item.images && Array.isArray(item.images)) {
    for (const img of item.images) {
      if (img && (img.includes('firebasestorage') || !img.startsWith('http'))) {
        targets.push(img);
      }
    }
  }

  if (item.content) {
    const matched = item.content.match(/https:\/\/firebasestorage\.googleapis\.com\/[^\s"')]+/g);
    if (matched) {
      targets.push(...matched);
    }
  }

  // De-duplicate targets
  const uniqueTargets = Array.from(new Set(targets));

  await Promise.all(
    uniqueTargets.map(async (target) => {
      try {
        const storageRef = ref(storage, target);
        await deleteObject(storageRef);
      } catch {
        // Silently ignore if file already does not exist or storage path invalid
      }
    })
  );
}
