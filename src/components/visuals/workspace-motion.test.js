import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installWorkspaceMotion, pointerDepth } from './workspace-motion.js';

afterEach(() => vi.unstubAllGlobals());

describe('pointer depth', () => {
  const rect = { left: 20, top: 10, width: 100, height: 80 };
  it('centers and bounds rotations even when the pointer leaves a card', () => {
    expect(pointerDepth(70, 50, rect)).toEqual({ x: 0, y: 0 });
    expect(pointerDepth(-400, 400, rect)).toEqual({ x: -1, y: 1 });
  });
  it('never emits invalid transforms for collapsed elements', () => {
    const result = pointerDepth(0, 0, { left: 0, top: 0, width: 0, height: 0 });
    expect(Number.isFinite(result.x) && Number.isFinite(result.y)).toBe(true);
  });
});

describe('motion lifecycle', () => {
  let events, root, preference, card, queued;
  beforeEach(() => {
    events = {};
    preference = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    root = { addEventListener: vi.fn((name, fn) => { events[name] = fn; }), removeEventListener: vi.fn(), contains: () => true };
    card = { style: { setProperty: vi.fn(), removeProperty: vi.fn() }, setAttribute: vi.fn(), removeAttribute: vi.fn(), getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) };
    vi.stubGlobal('window', { matchMedia: () => preference });
    vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal('Element', class {});
    vi.stubGlobal('requestAnimationFrame', vi.fn(fn => { queued = fn; return 1; }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });
  function move() {
    const target = new Element();
    target.closest = () => card;
    events.pointermove({ target, clientX: 75, clientY: 25 });
  }
  it('batches pointer events into one frame and removes styles and listeners on cleanup', () => {
    const dispose = installWorkspaceMotion(root);
    move(); move();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    queued();
    expect(card.style.setProperty).toHaveBeenCalledWith('--pointer-x', '0.500');
    dispose();
    expect(card.style.removeProperty).toHaveBeenCalledWith('--pointer-x');
    expect(root.removeEventListener).toHaveBeenCalledWith('pointermove', events.pointermove);
    expect(preference.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
  it('skips rendering when reduced motion is enabled or the document is hidden', () => {
    const dispose = installWorkspaceMotion(root);
    preference.matches = false;
    move();
    preference.matches = true;
    document.hidden = true;
    move();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    dispose();
  });
  it('cancels pending frames and resets depth when scrolling', () => {
    const dispose = installWorkspaceMotion(root);
    move();
    events.scroll();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(card.removeAttribute).toHaveBeenCalledWith('data-depth-active');
    dispose();
  });
});
