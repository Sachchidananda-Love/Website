import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = join(projectRoot, 'assets/js/infinite-gallery-manifest.js');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.m4v']);
const videoExtensions = new Set(['.mp4', '.mov', '.m4v']);
const naturalSort = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

// These are the canonical, non-duplicated source trees used by the gallery.
// Digital Art HD is the complete digital collection; the other HD folders
// duplicate their smaller counterparts and are deliberately not indexed twice.
const collections = [
  { id: 'paintings', label: 'Paintings', root: 'assets/img/paintings' },
  { id: 'digital', label: 'Digital', root: 'assets/img/Digital Art HD' },
  { id: 'graphic-design', label: 'Graphic Design', root: 'assets/img/Graphic Design' },
  { id: 'photography', label: 'Photography', root: 'assets/img/Photography' },
  { id: 'videos', label: 'Videos', root: 'assets/img/Videos' }
];
// Kept in the source library but intentionally not published in the gallery.
const excludedMedia = new Set(['assets/img/Graphic Design/a-01.png']);

const toWebPath = (value) => value.split(sep).join('/');
const stemOf = (filePath) => filePath.slice(0, -extname(filePath).length);
const directSequenceNumber = (filePath) => {
  const match = stemOf(filePath.split(sep).at(-1)).match(/(?:^|[-_ ]+)(\d+)$/);
  return match ? Number(match[1]) : null;
};
const variantDetails = (filePath) => {
  const stem = stemOf(filePath.split(sep).at(-1));
  const match = stem.match(/^(.*?)[-_ ]+(\d+)$/);
  if (!match || !match[1].trim()) return null;
  return { base: match[1].trim(), sequence: Number(match[2]) };
};

function walkMedia(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return walkMedia(absolutePath);
    if (!entry.isFile() || !supportedExtensions.has(extname(entry.name).toLowerCase())) return [];
    return [absolutePath];
  });
}

function dimensionsFor(filePath, type) {
  if (type === 'video') return { width: 16, height: 9 };
  try {
    const output = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', filePath], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    const width = Number(output.match(/pixelWidth:\s*(\d+)/)?.[1]);
    const height = Number(output.match(/pixelHeight:\s*(\d+)/)?.[1]);
    if (width > 0 && height > 0) return { width, height };
  } catch {
    // Runtime media sizing safely falls back to a neutral frame below.
  }
  return { width: 4, height: 3 };
}

function makeMedia(filePath) {
  const webPath = toWebPath(relative(projectRoot, filePath));
  const type = videoExtensions.has(extname(filePath).toLowerCase()) ? 'video' : 'image';
  return { src: webPath, type, ...dimensionsFor(filePath, type) };
}

function buildCollection({ id, label, root }) {
  const absoluteRoot = join(projectRoot, root);
  if (!statSync(absoluteRoot).isDirectory()) throw new Error(`Missing gallery collection: ${root}`);
  const files = walkMedia(absoluteRoot).filter((filePath) => !excludedMedia.has(toWebPath(relative(projectRoot, filePath)))).sort((a, b) => naturalSort.compare(a, b));
  const directFilesByDirectory = new Map();

  files.forEach((filePath) => {
    const directory = dirname(filePath);
    if (!directFilesByDirectory.has(directory)) directFilesByDirectory.set(directory, []);
    directFilesByDirectory.get(directory).push(filePath);
  });

  // A nested folder whose contents are predominantly numbered is treated as
  // one project. This covers Product Slides, Spoonfed, and similarly structured
  // folders added later without collapsing a collection root like Photography.
  const folderProjects = new Set();
  directFilesByDirectory.forEach((directoryFiles, directory) => {
    if (directory === absoluteRoot || directoryFiles.length < 2) return;
    const numberedCount = directoryFiles.filter((filePath) => directSequenceNumber(filePath) !== null).length;
    if (numberedCount >= 2 && numberedCount / directoryFiles.length >= 0.6) folderProjects.add(directory);
  });

  // Filename sequences only become a group when at least two siblings share
  // the same explicit trailing-number base. A lone year or unrelated number
  // therefore remains an independent artwork.
  const sequenceCounts = new Map();
  files.forEach((filePath) => {
    if (folderProjects.has(dirname(filePath))) return;
    const details = variantDetails(filePath);
    if (!details) return;
    const key = `${dirname(filePath)}\0${details.base.toLocaleLowerCase()}`;
    sequenceCounts.set(key, (sequenceCounts.get(key) || 0) + 1);
  });

  const groups = new Map();
  files.forEach((filePath) => {
    const directory = dirname(filePath);
    const details = variantDetails(filePath);
    const sequenceKey = details ? `${directory}\0${details.base.toLocaleLowerCase()}` : null;
    let key = `single:${filePath}`;
    let title = stemOf(filePath.split(sep).at(-1));

    if (folderProjects.has(directory)) {
      key = `folder:${directory}`;
      title = directory.split(sep).at(-1);
    } else if (sequenceKey && sequenceCounts.get(sequenceKey) > 1) {
      key = `sequence:${sequenceKey}`;
      title = details.base;
    }

    if (!groups.has(key)) {
      groups.set(key, {
        id: `${id}-${groups.size + 1}`,
        category: id,
        collection: label,
        title,
        media: []
      });
    }
    groups.get(key).media.push(makeMedia(filePath));
  });

  return [...groups.values()].map((group) => {
    group.media.sort((left, right) => {
      const leftNumber = directSequenceNumber(left.src);
      const rightNumber = directSequenceNumber(right.src);
      if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) return leftNumber - rightNumber;
      if (leftNumber !== null && rightNumber === null) return -1;
      if (leftNumber === null && rightNumber !== null) return 1;
      return naturalSort.compare(left.src, right.src);
    });
    return group;
  });
}

const items = collections.flatMap(buildCollection);
const manifest = {
  collections: collections.map(({ id, label }) => ({ id, label })),
  itemCount: items.length,
  mediaCount: items.reduce((total, item) => total + item.media.length, 0),
  items
};
const output = `// Generated by scripts/generate-infinite-gallery-manifest.mjs. Do not edit by hand.\nwindow.INFINITE_GALLERY_MEDIA = ${JSON.stringify(manifest, null, 2)};\n`;

writeFileSync(outputPath, output, 'utf8');
console.log(`Generated ${relative(projectRoot, outputPath)} with ${manifest.itemCount} grouped artworks and ${manifest.mediaCount} media files.`);
