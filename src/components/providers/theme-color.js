export const DEFAULT_PRIMARY_COLOR = '#3E6A9F';
export const THEME_COLOR_STORAGE_KEY = 'app_primary_color';

export function normalizeThemeColor(value) {
  if (typeof value !== 'string') return null;
  const hex = value.trim();
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toUpperCase() : null;
}

export function primaryTextColor(color) {
  const hex = normalizeThemeColor(color) || DEFAULT_PRIMARY_COLOR;
  const channels = [1, 3, 5].map(index => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05) ? '#000000' : '#FFFFFF';
}
