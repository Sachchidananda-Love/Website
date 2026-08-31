import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestSource = readFileSync(join(projectRoot, 'assets/js/infinite-gallery-manifest.js'), 'utf8');
const assignment = manifestSource.match(/window\.INFINITE_GALLERY_MEDIA\s*=\s*([\s\S]+);\s*$/);
if (!assignment) throw new Error('Could not parse infinite gallery manifest.');
const manifest = JSON.parse(assignment[1]);
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const allMedia = manifest.items.flatMap((item) => item.media.map((media) => ({ item, media })));
assert(manifest.itemCount === manifest.items.length, 'itemCount does not match items array.');
assert(manifest.mediaCount === allMedia.length, 'mediaCount does not match grouped media.');

const uniquePaths = new Set(allMedia.map(({ media }) => media.src));
assert(uniquePaths.size === allMedia.length, 'One or more media paths appear in multiple gallery items.');
allMedia.forEach(({ media }) => {
  assert(existsSync(join(projectRoot, media.src)), `Missing media path: ${media.src}`);
  assert(media.width > 0 && media.height > 0, `Invalid dimensions: ${media.src}`);
});

const blackCoffee = manifest.items.find((item) => item.title === 'Black Coffee & Bourbon');
assert(blackCoffee, 'Black Coffee & Bourbon folder was not grouped.');
assert(blackCoffee?.media.length === 2, 'Black Coffee & Bourbon should contain two slides.');
assert(blackCoffee?.media[0].src.endsWith('/Black Coffee & Bourbon/1.png'), 'Black Coffee & Bourbon slide 1 is not the default.');
assert(!manifest.items.some((item) => item.media[0].src.endsWith('/Black Coffee & Bourbon/2.png')), 'Black Coffee & Bourbon slide 2 appears independently.');

const sabhava = manifest.items.find((item) => item.title === 'Sabhāva');
assert(sabhava?.media.length === 6, 'Sabhāva filename variants were not grouped together.');
assert(sabhava?.media[0].src.endsWith('/Sabhāva-1.png'), 'Sabhāva-1 is not the default.');

const newSkies = manifest.items.find((item) => item.title === 'New Skies 2025');
assert(newSkies?.media.length === 10, 'New Skies 2025 folder was not grouped into ten views.');
assert(newSkies?.media[0].src.endsWith('/Merch-01.png'), 'New Skies 2025 does not begin with Merch-01.');

const photographyItems = manifest.items.filter((item) => item.category === 'photography');
assert(photographyItems.some((item) => item.title === '001'), 'Photography/001 should remain an independent artwork.');
assert(photographyItems.some((item) => item.title === '002'), 'Photography/002 should remain an independent artwork.');

assert(allMedia.some(({ media }) => media.type === 'video'), 'No videos were indexed.');
assert(allMedia.some(({ media }) => media.src.toLowerCase().endsWith('.mov')), 'MOV graceful-fallback path was not exercised.');

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL: ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Validated ${manifest.itemCount} grouped artworks and ${manifest.mediaCount} media paths.`);
  console.log('Verified Black Coffee & Bourbon, Sabhāva, New Skies 2025, Photography numbering, and video inclusion.');
}
