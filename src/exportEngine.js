export const EXPORT_FORMATS = Object.freeze({
  pdf: { extension: 'pdf', fidelity: 'pixel', raster: 'png', multiPage: true },
  docx: { extension: 'docx', fidelity: 'pixel', raster: 'png', multiPage: true },
  'docx-editable': { extension: 'docx', fidelity: 'semantic', raster: null, multiPage: true },
  png: { extension: 'png', fidelity: 'pixel', raster: 'png', multiPage: true },
  jpg: { extension: 'jpg', fidelity: 'pixel', raster: 'jpg', multiPage: true },
  svg: { extension: 'svg', fidelity: 'pixel', raster: 'png', multiPage: true },
  html: { extension: 'html', fidelity: 'css', raster: null, multiPage: true },
  txt: { extension: 'txt', fidelity: 'semantic', raster: null, multiPage: true },
  rtf: { extension: 'rtf', fidelity: 'semantic', raster: null, multiPage: true },
});

export function buildExportPlan({ format, pageCount, quality = 'ultra', templateId = '', contentFingerprint = '' }) {
  const descriptor = EXPORT_FORMATS[format];
  if (!descriptor) throw new Error(`Unsupported export format: ${format}`);
  const normalizedPageCount = Math.max(1, Number(pageCount) || 1);
  return {
    format,
    extension: descriptor.extension,
    fidelity: descriptor.fidelity,
    raster: descriptor.raster,
    pageCount: normalizedPageCount,
    pixelRatio: quality === 'ultra' ? 4 : 2,
    templateId: String(templateId || ''),
    contentFingerprint: String(contentFingerprint || ''),
    preservesAllPages: descriptor.multiPage,
  };
}

export function dataUrlToUint8Array(dataUrl = '') {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new Error('Invalid image data URL.');
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function escapeRtf(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/[{}]/g, '\\$&')
    .replace(/[^\x00-\x7F]/g, character => `\\u${character.charCodeAt(0)}?`)
    .replace(/\r?\n/g, '\\par\n');
}

export function buildRasterSvg(renderedPages) {
  let verticalOffset = 0;
  let maximumWidth = 0;
  const images = renderedPages.map(({ dataUrl, paper }, pageIndex) => {
    const image = `<image data-page="${pageIndex + 1}" x="0" y="${verticalOffset}" width="${paper.widthPx}" height="${paper.heightPx}" preserveAspectRatio="none" href="${dataUrl}"/>`;
    verticalOffset += paper.heightPx;
    maximumWidth = Math.max(maximumWidth, paper.widthPx);
    return image;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${maximumWidth}" height="${verticalOffset}" viewBox="0 0 ${maximumWidth} ${verticalOffset}">${images}</svg>`;
}

export function createExportHost({ className, style, markup, paper, pageIndex, pageCount, runningHeader }) {
  const host = document.createElement('div');
  host.dataset.exportHost = 'true';
  Object.assign(host.style, {
    position: 'fixed',
    left: '-200vw',
    top: '0',
    width: `${paper.widthPx}px`,
    height: `${paper.heightPx}px`,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: '-2147483647',
  });

  const node = document.createElement('article');
  node.className = className;
  node.dataset.pageNumber = String(pageIndex + 1);
  node.dataset.pageCount = String(pageCount);
  node.dataset.runningHeader = runningHeader;
  Object.assign(node.style, {
    position: 'relative',
    left: '0',
    top: '0',
    margin: '0',
    width: `${paper.widthPx}px`,
    minWidth: `${paper.widthPx}px`,
    maxWidth: `${paper.widthPx}px`,
    height: `${paper.heightPx}px`,
    minHeight: `${paper.heightPx}px`,
    maxHeight: `${paper.heightPx}px`,
    transform: 'none',
    transformOrigin: 'top left',
    overflow: 'hidden',
  });
  Object.entries(style).forEach(([key, value]) => node.style.setProperty(key, String(value)));
  node.innerHTML = markup;
  host.appendChild(node);
  document.body.appendChild(host);
  return { host, node };
}

export async function waitForExportAssets(node) {
  if (/jsdom/i.test(navigator?.userAgent || '')) return;
  if (document.fonts?.ready) await document.fonts.ready;
  const images = [...node.querySelectorAll('img')];
  await Promise.all(images.map(image => {
    if (image.complete && image.naturalWidth > 0) return image.decode?.().catch(() => {}) || Promise.resolve();
    return new Promise(resolve => {
      const done = () => resolve();
      image.addEventListener('load', done, { once: true });
      image.addEventListener('error', done, { once: true });
      window.setTimeout(done, 5000);
    });
  }));
  const frame = window.requestAnimationFrame || (callback => window.setTimeout(callback, 16));
  await new Promise(resolve => frame(() => frame(resolve)));
}

export async function assertRasterHasVisibleContent(dataUrl, shouldContainContent = true) {
  if (!shouldContainContent || typeof Image === 'undefined' || /jsdom/i.test(navigator?.userAgent || '')) return true;
  const image = await new Promise((resolve, reject) => {
    const candidate = new Image();
    candidate.onload = () => resolve(candidate);
    candidate.onerror = () => reject(new Error('The exported page image could not be decoded.'));
    candidate.src = dataUrl;
  });
  const canvas = document.createElement('canvas');
  const sampleWidth = Math.min(160, image.naturalWidth || image.width);
  const sampleHeight = Math.min(224, image.naturalHeight || image.height);
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return true;
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const reference = [pixels[0], pixels[1], pixels[2], pixels[3]];
  let changed = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const distance = Math.abs(pixels[index] - reference[0]) + Math.abs(pixels[index + 1] - reference[1]) + Math.abs(pixels[index + 2] - reference[2]) + Math.abs(pixels[index + 3] - reference[3]);
    if (distance > 32) changed += 1;
  }
  if (changed / (sampleWidth * sampleHeight) < 0.0015) throw new Error('The rendered export was blank. No file was downloaded.');
  return true;
}

export function collectDocumentCss() {
  return [...document.styleSheets].map(sheet => {
    try { return [...sheet.cssRules].map(rule => rule.cssText).join('\n'); }
    catch { return ''; }
  }).join('\n');
}
