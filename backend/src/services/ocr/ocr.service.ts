import { createWorker, Worker } from 'tesseract.js';
import { LabelAngle } from '../../types/compliance.types.js';

export interface OcrTextLine {
  text: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface OcrImageResult {
  imageId: string;
  labelAngle: LabelAngle;
  rawText: string;
  lines: OcrTextLine[];
  processedAt: string;
}

export class OcrService {
  private static workerInstance: Worker | null = null;
  private static isInitializing = false;

  private static async getWorker(): Promise<Worker> {
    if (this.workerInstance) {
      return this.workerInstance;
    }
    if (this.isInitializing) {
      // Wait for initialization
      while (this.isInitializing) {
        await new Promise(r => setTimeout(r, 50));
      }
      if (this.workerInstance) return this.workerInstance;
    }

    try {
      this.isInitializing = true;
      const worker = await createWorker('eng');
      this.workerInstance = worker;
      return worker;
    } catch (err) {
      console.error('[OCR Engine] Worker initialization warning:', err);
      // Fallback: create fresh worker instance
      return await createWorker('eng');
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Extracts text directly from SVG XML markup if the file is SVG
   */
  private static extractTextFromSvg(svgContent: string): string[] {
    const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/gi;
    const tspanRegex = /<tspan[^>]*>([\s\S]*?)<\/tspan>/gi;
    const lines: string[] = [];
    
    let match: RegExpExecArray | null;
    while ((match = textRegex.exec(svgContent)) !== null) {
      const rawBlock = match[1];
      // Check for tspans within text
      let tspanMatch: RegExpExecArray | null;
      let hasTspan = false;
      while ((tspanMatch = tspanRegex.exec(rawBlock)) !== null) {
        hasTspan = true;
        const clean = tspanMatch[1].replace(/<[^>]+>/g, '').trim();
        if (clean) lines.push(clean);
      }
      if (!hasTspan) {
        const clean = rawBlock.replace(/<[^>]+>/g, '').trim();
        if (clean) lines.push(clean);
      }
    }
    return lines;
  }

  /**
   * Processes a real label image (Buffer, Base64 Data URL, SVG, or raw image)
   * and runs genuine optical character recognition.
   */
  public static async processImage(
    imageId: string,
    labelAngle: LabelAngle,
    imageInput?: Buffer | string,
    customText?: string
  ): Promise<OcrImageResult> {
    // 1. If explicit custom text is provided, format it into structured lines
    if (customText && customText.trim()) {
      const lines = customText
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map((lineText, idx) => ({
          text: lineText,
          confidence: 0.95,
          boundingBox: { x: 10, y: 15 + idx * 30, width: Math.min(800, lineText.length * 10), height: 25 }
        }));

      return {
        imageId,
        labelAngle,
        rawText: customText.trim(),
        lines,
        processedAt: new Date().toISOString()
      };
    }

    // 2. If no image data provided at all
    if (!imageInput) {
      return {
        imageId,
        labelAngle,
        rawText: '',
        lines: [],
        processedAt: new Date().toISOString()
      };
    }

    try {
      // Check if imageInput is an SVG data URL or SVG string
      let isSvg = false;
      let svgText = '';
      if (typeof imageInput === 'string') {
        if (imageInput.startsWith('data:image/svg+xml;base64,')) {
          isSvg = true;
          const b64 = imageInput.replace('data:image/svg+xml;base64,', '');
          svgText = Buffer.from(b64, 'base64').toString('utf-8');
        } else if (imageInput.startsWith('data:image/svg+xml;utf8,')) {
          isSvg = true;
          const raw = imageInput.replace('data:image/svg+xml;utf8,', '');
          try {
            svgText = decodeURIComponent(raw);
          } catch {
            svgText = raw;
          }
        } else if (imageInput.includes('<svg')) {
          isSvg = true;
          svgText = imageInput;
        }
      }

      if (isSvg && svgText) {
        const svgLines = this.extractTextFromSvg(svgText);
        if (svgLines.length > 0) {
          const lines: OcrTextLine[] = svgLines.map((lineText, idx) => ({
            text: lineText,
            confidence: 0.98,
            boundingBox: { x: 10, y: 15 + idx * 30, width: Math.min(800, lineText.length * 10), height: 25 }
          }));

          return {
            imageId,
            labelAngle,
            rawText: svgLines.join('\n'),
            lines,
            processedAt: new Date().toISOString()
          };
        }
      }

      // Convert data URL to Buffer if needed
      let bufferToProcess: Buffer;
      if (Buffer.isBuffer(imageInput)) {
        bufferToProcess = imageInput;
      } else if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
        const base64Index = imageInput.indexOf(';base64,');
        if (base64Index !== -1) {
          const b64 = imageInput.slice(base64Index + 8);
          bufferToProcess = Buffer.from(b64, 'base64');
        } else {
          bufferToProcess = Buffer.from(imageInput);
        }
      } else if (typeof imageInput === 'string') {
        bufferToProcess = Buffer.from(imageInput);
      } else {
        throw new Error('Unsupported image input format');
      }

      // Run Tesseract OCR on the actual image buffer
      const worker = await this.getWorker();
      const ocrResult = await worker.recognize(bufferToProcess);
      
      const recognizedLines: OcrTextLine[] = [];
      const pageData = ocrResult.data as any;
      const linesArray = pageData.lines || [];

      if (linesArray.length > 0) {
        for (const l of linesArray) {
          const text = l.text.trim();
          if (text) {
            recognizedLines.push({
              text,
              confidence: Number(((l.confidence || 80) / 100).toFixed(2)),
              boundingBox: l.bbox ? {
                x: l.bbox.x0,
                y: l.bbox.y0,
                width: l.bbox.x1 - l.bbox.x0,
                height: l.bbox.y1 - l.bbox.y0
              } : undefined
            });
          }
        }
      } else if (ocrResult.data.text && ocrResult.data.text.trim()) {
        ocrResult.data.text.split('\n').forEach((t, idx) => {
          const clean = t.trim();
          if (clean) {
            recognizedLines.push({
              text: clean,
              confidence: Number(((ocrResult.data.confidence || 80) / 100).toFixed(2)),
              boundingBox: { x: 15, y: 20 + idx * 30, width: clean.length * 10, height: 25 }
            });
          }
        });
      }

      const rawText = recognizedLines.map(l => l.text).join('\n');

      return {
        imageId,
        labelAngle,
        rawText,
        lines: recognizedLines,
        processedAt: new Date().toISOString()
      };
    } catch (err: any) {
      console.error(`[OCR Engine] Error recognizing image ${imageId}:`, err?.message || err);
      return {
        imageId,
        labelAngle,
        rawText: '',
        lines: [],
        processedAt: new Date().toISOString()
      };
    }
  }
}
