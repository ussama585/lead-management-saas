import { describe, it, expect } from 'vitest';
import { modalPositionStyle } from './app-modal.jsx';

describe('modal viewport positioning', () => {
  it('centers ordinary dialogs and limits their height', () => {
    expect(modalPositionStyle()).toMatchObject({ top: '50%', translate: '-50% -50%', overflowY: 'auto' });
    expect(modalPositionStyle().maxHeight).toContain('100dvh - 48px');
  });
  it('keeps follow-up dialogs below their top gap', () => {
    const result = modalPositionStyle({ top: 'max(24px, 6vh)' }, false);
    expect(result.translate).toBe('-50% 0');
    expect(result.top).toBe('max(24px, 6vh)');
    expect(result.maxHeight).toContain('100dvh - (max(24px, 6vh)) - 24px');
  });
  it('handles numeric offsets and explicitly top-aligned dialogs', () => {
    expect(modalPositionStyle({ top: 20 }).maxHeight).toContain('(20px)');
    expect(modalPositionStyle({}, false)).toMatchObject({ top: 24, translate: '-50% 0' });
  });
});
