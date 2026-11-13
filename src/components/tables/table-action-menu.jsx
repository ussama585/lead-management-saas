import React, { useState } from 'react';
import { MoreVertical, Eye, Pencil, Trash2, RotateCcw, Download, Upload, Copy, Share2, Check, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu.jsx';
import { Modal } from '../ui/app-modal.jsx';
import { Button } from '../ui/button.jsx';

const text = node => typeof node === 'string' || typeof node === 'number' ? String(node)
  : React.isValidElement(node) ? text(node.props.children) : Array.isArray(node) ? node.map(text).join(' ') : '';

function disabledTrigger(node) {
  if (!React.isValidElement(node)) return false;
  if (node.props.disabled || node.props.loading) return true;
  return React.Children.toArray(node.props.children).some(disabledTrigger);
}

export function collectTableActions(node, fallback = 'Action') {
  if (!React.isValidElement(node)) return [];
  const props = node.props;
  const label = text(props.title) || props['aria-label'] || props.alt || text(props.children).trim() || fallback;
  if (props.onConfirm) return [{ label: fallback, confirm: props, onClick: props.onConfirm, disabled: disabledTrigger(node) }];
  if (props.onClick || props.href || props.to) return [{ label, onClick: props.onClick, link: props.href || props.to ? node : null, disabled: props.disabled || props.loading }];
  const children = React.Children.toArray(props.children);
  if (!children.length && typeof node.type !== 'string') return [{ label, custom: node }];
  return children.flatMap(child => collectTableActions(child, label));
}

function actionIcon(label) {
  if (/delete|remove/i.test(label)) return Trash2;
  if (/restore/i.test(label)) return RotateCcw;
  if (/edit|update/i.test(label)) return Pencil;
  if (/download|export/i.test(label)) return Download;
  if (/upload|import/i.test(label)) return Upload;
  if (/copy/i.test(label)) return Copy;
  if (/share/i.test(label)) return Share2;
  if (/approve|accept/i.test(label)) return Check;
  if (/view|detail|profile|open/i.test(label)) return Eye;
  return Settings;
}

export default function TableActionMenu({ actions }) {
  const [confirmation, setConfirmation] = useState(null);
  if (!actions.length) return <span>-</span>;
  return <div className="table-action-menu" onClick={event => event.stopPropagation()}>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button type="button" className="table-action-menu__trigger" aria-label="Row actions" title="Row actions"><MoreVertical width={32} height={32} /></button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => {
          const Icon = actionIcon(action.label);
          const content = <><Icon size={16} className="text-[#3e6a9f]" /><span>{action.label}</span></>;
          return action.custom ? <div key={index} className="table-action-menu__custom">{action.custom}<span>{action.label}</span></div> : action.link ? <DropdownMenuItem key={index} disabled={action.disabled} asChild>{React.cloneElement(action.link, { children: content })}</DropdownMenuItem>
            : <DropdownMenuItem key={index} disabled={action.disabled} onSelect={event => action.confirm ? setConfirmation(action) : action.onClick?.(event)}>{content}</DropdownMenuItem>;
        })}
      </DropdownMenuContent>
    </DropdownMenu>
    {confirmation && <Modal open title={confirmation.confirm.title} onCancel={() => { confirmation.confirm.onCancel?.(); setConfirmation(null); }} footer={null}>
      {confirmation.confirm.description}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => setConfirmation(null)}>{confirmation.confirm.cancelText || 'Cancel'}</Button>
        <Button onClick={() => { confirmation.onClick(); setConfirmation(null); }}>{confirmation.confirm.okText || 'Confirm'}</Button>
      </div>
    </Modal>}
  </div>;
}
