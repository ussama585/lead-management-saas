import { describe, expect, it } from 'vitest';
import { normalizeThemeColor, primaryTextColor } from './theme-color.js';

describe('theme color preferences', () => {
  it('normalizes valid custom colors', () => {
    expect(normalizeThemeColor('  #3e6a9f ')).toBe('#3E6A9F');
  });
  it.each([null, '', '#xyzxyz', '#fff', 'red', 'javascript:alert(1)'])('rejects invalid stored colors: %s', value => {
    expect(normalizeThemeColor(value)).toBeNull();
  });
  it('chooses contrasting primary text for light and dark backgrounds', () => {
    expect(primaryTextColor('#FFFFFF')).toBe('#000000');
    expect(primaryTextColor('#FFFF00')).toBe('#000000');
    expect(primaryTextColor('#000000')).toBe('#FFFFFF');
    expect(primaryTextColor('#3E6A9F')).toBe('#FFFFFF');
  });
});
