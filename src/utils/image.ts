import { UserFacingError } from './errors';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

/**
 * Prépare une photo de profil : contrôle du format, recadrage au centre en carré, réduction à `size` px,
 * export JPEG. Le fichier envoyé pèse quelques dizaines de Ko quelle que soit la photo d'origine.
 */
export async function prepareAvatar(file: File, size = 512): Promise<Blob> {
  if (!ACCEPTED.includes(file.type)) throw new UserFacingError('Format non pris en charge : utilisez une image JPEG, PNG ou WebP.');
  if (file.size > MAX_INPUT_BYTES) throw new UserFacingError('Image trop lourde : 8 Mo maximum.');

  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new UserFacingError('Cette image est illisible. Essayez un autre fichier.'); }

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) { bitmap.close(); throw new UserFacingError("Le traitement de l'image n'est pas disponible dans ce navigateur."); }
  ctx.fillStyle = '#FFFFFF'; // un PNG transparent devient blanc, car le JPEG n'a pas de transparence
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
  if (!blob) throw new UserFacingError("L'image n'a pas pu être préparée. Essayez un autre fichier.");
  return blob;
}
