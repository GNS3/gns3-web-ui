import { Terminal } from 'ghostty-web';

export interface ConsoleThemeColors {
  foregroundColor: string;
  backgroundColor: string;
}

export interface ConsoleColors {
  foregroundColor: string;
  backgroundColor: string;
}

export const DEFAULT_CONSOLE_FOREGROUND_COLOR = '#d4d4d4';
export const DEFAULT_CONSOLE_BACKGROUND_COLOR = '#000000';
export const CONSOLE_COLORS_STORAGE_KEY = 'gns3.webConsole.colors.v1';

export function loadConsoleColors(): ConsoleColors {
  try {
    const stored = localStorage.getItem(CONSOLE_COLORS_STORAGE_KEY);
    if (!stored) {
      return {
        foregroundColor: DEFAULT_CONSOLE_FOREGROUND_COLOR,
        backgroundColor: DEFAULT_CONSOLE_BACKGROUND_COLOR,
      };
    }

    const parsed = JSON.parse(stored) as Partial<ConsoleColors>;
    const foregroundColor = isHexColor(parsed.foregroundColor)
      ? parsed.foregroundColor
      : DEFAULT_CONSOLE_FOREGROUND_COLOR;
    const backgroundColor = isHexColor(parsed.backgroundColor)
      ? parsed.backgroundColor
      : DEFAULT_CONSOLE_BACKGROUND_COLOR;

    return { foregroundColor, backgroundColor };
  } catch {
    return {
      foregroundColor: DEFAULT_CONSOLE_FOREGROUND_COLOR,
      backgroundColor: DEFAULT_CONSOLE_BACKGROUND_COLOR,
    };
  }
}

export function saveConsoleColors(colors: ConsoleColors): void {
  try {
    localStorage.setItem(CONSOLE_COLORS_STORAGE_KEY, JSON.stringify(colors));
  } catch {
    // Ignore storage failures (private mode/quota issues).
  }
}

export function applyGhosttyTheme(
  term: Terminal | undefined,
  terminalElement: HTMLElement | null | undefined,
  colors: ConsoleThemeColors
): void {
  if (terminalElement) {
    terminalElement.style.background = colors.backgroundColor;
    // ghostty-web marks the host element contenteditable; hide browser caret artifacts.
    terminalElement.style.caretColor = 'transparent';
    terminalElement.style.outline = 'none';
  }

  if (!term) {
    return;
  }

  const theme = {
    ...(term.options.theme || {}),
    background: colors.backgroundColor,
    foreground: colors.foregroundColor,
    cursor: colors.foregroundColor,
  };

  // Keep options in sync for future terminal operations.
  term.options.theme = theme;

  const termAny = term as any;
  const renderer = termAny?.renderer;
  const wasmTerm = termAny?.wasmTerm;
  if (!renderer || !wasmTerm || typeof renderer.setTheme !== 'function' || typeof renderer.render !== 'function') {
    return;
  }

  installGhosttySelectionFillFix(termAny);
  installGhosttyColorOverride(termAny, colors.foregroundColor, colors.backgroundColor);

  const resolvedColors = typeof wasmTerm.getColors === 'function' ? wasmTerm.getColors() : null;
  if (resolvedColors?.foreground) {
    renderer.__gns3DefaultForeground = resolvedColors.foreground;
  }
  if (resolvedColors?.background) {
    renderer.__gns3DefaultBackground = resolvedColors.background;
  }
  renderer.__gns3ForegroundOverride = colors.foregroundColor;
  renderer.__gns3BackgroundOverride = colors.backgroundColor;

  renderer.setTheme(theme);
  renderer.render(
    wasmTerm,
    true,
    termAny.viewportY ?? 0,
    termAny,
    termAny.scrollbarOpacity ?? 0
  );
}

export function installGhosttySelectionFillFix(term: Terminal | any): void {
  const termAny = term as any;
  const renderer = termAny?.renderer;
  if (!renderer || renderer.__gns3SelectionFillFixInstalled) {
    return;
  }

  const originalRenderCellBackground =
    typeof renderer.renderCellBackground === 'function' ? renderer.renderCellBackground.bind(renderer) : null;
  const isInSelection = typeof renderer.isInSelection === 'function' ? renderer.isInSelection.bind(renderer) : null;
  if (!originalRenderCellBackground || !isInSelection) {
    return;
  }

  renderer.__gns3SelectionFillFixInstalled = true;
  renderer.__gns3OriginalRenderCellBackground = originalRenderCellBackground;
  renderer.renderCellBackground = (cell: any, column: number, row: number) => {
    if (!isInSelection(column, row)) {
      renderer.__gns3OriginalRenderCellBackground(cell, column, row);
      return;
    }

    const metrics = renderer.metrics;
    const ctx = renderer.ctx;
    if (!metrics || !ctx) {
      renderer.__gns3OriginalRenderCellBackground(cell, column, row);
      return;
    }

    const dprRaw = Number(renderer.devicePixelRatio || (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1);
    const dpr = dprRaw > 0 ? dprRaw : 1;

    const xStart = Math.floor(column * metrics.width * dpr) / dpr;
    const yStart = Math.floor(row * metrics.height * dpr) / dpr;
    const xEnd = Math.ceil((column * metrics.width + metrics.width * (cell?.width || 1)) * dpr) / dpr;
    const yEnd = Math.ceil((row * metrics.height + metrics.height) * dpr) / dpr;

    ctx.fillStyle = renderer.theme?.selectionBackground || '#2f67c2';
    ctx.fillRect(xStart, yStart, Math.max(1 / dpr, xEnd - xStart), Math.max(1 / dpr, yEnd - yStart));
  };
}

export function fitGhosttyToRenderedCanvas(
  term: Terminal,
  terminalElement: HTMLElement,
  targetWidth: number,
  targetHeight: number,
  cols: number,
  rows: number
): { cols: number; rows: number } {
  const canvas = terminalElement.querySelector('canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    return { cols, rows };
  }

  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return { cols, rows };
  }

  const cellWidth = rect.width / cols;
  const cellHeight = rect.height / rows;
  if (cellWidth <= 0 || cellHeight <= 0) {
    return { cols, rows };
  }

  const fittedCols = Math.max(2, Math.floor(targetWidth / cellWidth));
  const fittedRows = Math.max(1, Math.floor(targetHeight / cellHeight));

  if (fittedCols === cols && fittedRows === rows) {
    return { cols, rows };
  }

  term.resize(fittedCols, fittedRows);
  return { cols: fittedCols, rows: fittedRows };
}

export function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  if (chunks.length === 1) {
    return chunks[0];
  }

  let totalLength = 0;
  for (const chunk of chunks) {
    totalLength += chunk.length;
  }

  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

export class TelnetIacStripper {
  private pending: Uint8Array = new Uint8Array(0);

  push(chunk: Uint8Array): Uint8Array {
    if (this.pending.length === 0 && chunk.indexOf(0xff) === -1) {
      // Most console traffic is plain text; avoid extra allocations on the hot path.
      return chunk;
    }

    const input = this.pending.length
      ? this.mergePendingAndChunk(this.pending, chunk)
      : chunk;

    const output = new Uint8Array(input.length);
    let outputLength = 0;
    this.pending = new Uint8Array(0);

    let i = 0;
    while (i < input.length) {
      if (input[i] !== 0xff) {
        output[outputLength++] = input[i];
        i++;
        continue;
      }

      if (i + 1 >= input.length) {
        this.pending = input.slice(i);
        break;
      }

      const cmd = input[i + 1];

      if (cmd === 0xff) {
        output[outputLength++] = 0xff;
        i += 2;
        continue;
      }

      if (cmd === 0xfb || cmd === 0xfc || cmd === 0xfd || cmd === 0xfe) {
        if (i + 2 >= input.length) {
          this.pending = input.slice(i);
          break;
        }
        i += 3;
        continue;
      }

      if (cmd === 0xfa) {
        let end = -1;
        for (let j = i + 2; j + 1 < input.length; j++) {
          if (input[j] === 0xff && input[j + 1] === 0xf0) {
            end = j;
            break;
          }
        }

        if (end === -1) {
          this.pending = input.slice(i);
          break;
        }

        i = end + 2;
        continue;
      }

      i += 2;
    }

    return outputLength === output.length ? output : output.slice(0, outputLength);
  }

  private mergePendingAndChunk(pending: Uint8Array, chunk: Uint8Array): Uint8Array {
    const merged = new Uint8Array(pending.length + chunk.length);
    merged.set(pending, 0);
    merged.set(chunk, pending.length);
    return merged;
  }
}

function installGhosttyColorOverride(termAny: any, foregroundColor: string, backgroundColor: string): void {
  const renderer = termAny?.renderer;
  if (!renderer || renderer.__gns3ColorOverrideInstalled) {
    return;
  }

  const originalRgbToCSS = typeof renderer.rgbToCSS === 'function' ? renderer.rgbToCSS.bind(renderer) : null;
  if (!originalRgbToCSS) {
    return;
  }

  renderer.__gns3ColorOverrideInstalled = true;
  renderer.__gns3OriginalRgbToCSS = originalRgbToCSS;
  renderer.rgbToCSS = (r: number, g: number, b: number) => {
    const defaultFg = renderer.__gns3DefaultForeground;
    if (
      defaultFg &&
      renderer.__gns3ForegroundOverride &&
      r === defaultFg.r &&
      g === defaultFg.g &&
      b === defaultFg.b
    ) {
      return renderer.__gns3ForegroundOverride;
    }

    const defaultBg = renderer.__gns3DefaultBackground;
    if (
      defaultBg &&
      renderer.__gns3BackgroundOverride &&
      r === defaultBg.r &&
      g === defaultBg.g &&
      b === defaultBg.b
    ) {
      return renderer.__gns3BackgroundOverride;
    }

    return renderer.__gns3OriginalRgbToCSS(r, g, b);
  };

  renderer.__gns3ForegroundOverride = foregroundColor;
  renderer.__gns3BackgroundOverride = backgroundColor;
}

function isHexColor(value: string | undefined): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}
