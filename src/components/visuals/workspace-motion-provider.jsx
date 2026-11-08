import { useEffect } from 'react';

export default function WorkspaceMotionProvider() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)');
    let disposed = false;
    let cleanup;
    let generation = 0;
    const update = async () => {
      const current = ++generation;
      cleanup?.();
      cleanup = undefined;
      if (!preference.matches) return;
      const { installWorkspaceMotion } = await import('./workspace-motion.js');
      if (!disposed && current === generation && preference.matches) cleanup = installWorkspaceMotion(document.body);
    };
    update();
    preference.addEventListener('change', update);
    return () => { disposed = true; preference.removeEventListener('change', update); cleanup?.(); };
  }, []);
  return null;
}
