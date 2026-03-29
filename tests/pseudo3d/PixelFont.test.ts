// tests/pseudo3d/PixelFont.test.ts
import { describe, it, expect } from 'vitest';
import { PixelFont } from '@/pseudo3d/PixelFont';

describe('PixelFont', () => {
  it('measures text width correctly', () => {
    const font = new PixelFont();
    expect(font.measureText('HELLO', 2)).toBe(5 * 6 * 2); // 5 chars * 6px * scale 2
  });

  it('measures empty string as zero', () => {
    const font = new PixelFont();
    expect(font.measureText('', 3)).toBe(0);
  });
});
