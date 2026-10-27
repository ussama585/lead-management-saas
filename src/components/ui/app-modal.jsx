import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog.jsx';
import { Button } from './app-controls.jsx';

export function modalPositionStyle(style = {}, centered = true) {
  const topAligned = style.top != null || !centered;
  const top = topAligned ? style.top ?? 24 : '50%';
  const topValue = typeof top === 'number' ? `${top}px` : top;
  return {
    ...style,
    top,
    translate: topAligned ? '-50% 0' : '-50% -50%',
    maxHeight: topAligned
      ? `min(${style.maxHeight || '90dvh'}, calc(100dvh - (${topValue}) - 24px))`
      : `min(${style.maxHeight || '90dvh'}, calc(100dvh - 48px))`,
    overflowY: 'auto',
  };
}

export function Modal({ open, visible, onCancel, onOk, children, title, footer, width, confirmLoading,
  okText = 'OK', cancelText = 'Cancel', okButtonProps, cancelButtonProps, closable = true,
  maskClosable = true, keyboard = true, className, style, styles, bodyStyle, afterClose, centered = true }) {
  return <Dialog open={open ?? visible ?? false} onOpenChange={next => { if (!next && !confirmLoading) { onCancel?.(); afterClose?.(); } }}>
    <DialogContent className={className} showCloseButton={closable && !confirmLoading} aria-describedby={undefined}
      style={{ maxWidth: typeof width === 'number' ? `${width}px` : width || '512px', ...modalPositionStyle(style, centered) }}
      onPointerDownOutside={event => { if (!maskClosable || confirmLoading) event.preventDefault(); }}
      onEscapeKeyDown={event => { if (!keyboard || confirmLoading) event.preventDefault(); }}>
      <DialogHeader className={!title ? 'sr-only' : undefined}><DialogTitle>{title || 'Dialog'}</DialogTitle></DialogHeader>
      <div style={{ ...bodyStyle, ...styles?.body }}>{children}</div>
      {footer !== null && <DialogFooter>
        {footer === undefined ? <>
          <Button {...cancelButtonProps} disabled={confirmLoading || cancelButtonProps?.disabled} onClick={onCancel}>{cancelText}</Button>
          <Button type="primary" {...okButtonProps} loading={confirmLoading} onClick={onOk}>{okText}</Button>
        </> : footer}
      </DialogFooter>}
    </DialogContent>
  </Dialog>;
}

function showModal(config) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let settings = config;
  const destroy = () => { root.unmount(); container.remove(); };
  function Confirm() {
    const [pending, setPending] = useState(false);
    return <Modal {...settings} open title={settings.title || 'Confirmation'} confirmLoading={pending}
      onCancel={() => { if (!pending) { settings.onCancel?.(); destroy(); } }}
      onOk={async () => {
        setPending(true);
        try { await settings.onOk?.(); destroy(); } catch { setPending(false); }
      }}>{settings.content}</Modal>;
  }
  root.render(<Confirm />);
  return { destroy, update: next => { settings = { ...settings, ...next }; root.render(<Confirm />); } };
}

Modal.confirm = showModal;
Modal.info = config => showModal({ ...config, cancelButtonProps: { style: { display: 'none' } } });
Modal.success = Modal.info;
Modal.error = Modal.info;
Modal.warning = Modal.info;
