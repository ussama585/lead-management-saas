export function pointerDepth(clientX, clientY, rect) {
  const clamp = value => Math.max(-1, Math.min(1, value));
  return {
    x: clamp(((clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2),
    y: clamp(((clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2),
  };
}

export function installWorkspaceMotion(root) {
  if (!root) return () => {};
  const preference = window.matchMedia('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)');
  let frame = 0;
  let active = null;
  let latest = null;
  const clear = () => {
    if (!active) return;
    active.style.removeProperty('--pointer-x');
    active.style.removeProperty('--pointer-y');
    active.removeAttribute('data-depth-active');
    active = null;
  };
  const reset = () => { cancelAnimationFrame(frame); frame = 0; latest = null; clear(); };
  const move = event => {
    if (!preference.matches || document.hidden) return;
    const target = event.target instanceof Element ? event.target.closest('.dashboard-stat-card, .sop-auth-brand') : null;
    if (!target || !root.contains(target)) { reset(); return; }
    if (target !== active) { clear(); active = target; }
    latest = { x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!active || !latest) return;
      const depth = pointerDepth(latest.x, latest.y, active.getBoundingClientRect());
      active.style.setProperty('--pointer-x', depth.x.toFixed(3));
      active.style.setProperty('--pointer-y', depth.y.toFixed(3));
      active.setAttribute('data-depth-active', 'true');
    });
  };
  root.addEventListener('pointermove', move, { passive: true });
  root.addEventListener('pointerleave', reset);
  root.addEventListener('scroll', reset, { passive: true, capture: true });
  document.addEventListener('visibilitychange', reset);
  preference.addEventListener('change', reset);
  return () => {
    reset();
    root.removeEventListener('pointermove', move);
    root.removeEventListener('pointerleave', reset);
    root.removeEventListener('scroll', reset, true);
    document.removeEventListener('visibilitychange', reset);
    preference.removeEventListener('change', reset);
  };
}
