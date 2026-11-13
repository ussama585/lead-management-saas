import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import AnimatedFollowUpIcon from './animated-follow-up-icon.jsx';

it('renders a keyboard accessible clock action with its existing label and handler', () => {
  const onClick = vi.fn();
  const onKeyDown = vi.fn();
  const props = { onClick, onKeyDown, 'aria-label': 'View remarks', disabled: true };
  const element = AnimatedFollowUpIcon.render(props, null);
  expect(element.type).toBe('button');
  expect(element.props.onClick).toBe(onClick);
  expect(element.props.onKeyDown).toBe(onKeyDown);
  const html = renderToStaticMarkup(<AnimatedFollowUpIcon {...props} />);
  expect(html).toContain('type="button"');
  expect(html).toContain('aria-label="View remarks"');
  expect(html).toContain('disabled=""');
  expect(html).toContain('M12 6v6l4 2');
});

it('uses a decorative clock inside existing buttons without nesting buttons', () => {
  const html = renderToStaticMarkup(<button type="button" aria-label="Remarks"><AnimatedFollowUpIcon /></button>);
  expect(html.match(/<button/g)).toHaveLength(1);
  expect(html).toContain('<span');
  expect(html).toContain('aria-hidden="true"');
});

it('uses the title as a label and preserves tooltip refs and mouse events', () => {
  const ref = React.createRef();
  const onMouseEnter = vi.fn();
  const element = AnimatedFollowUpIcon.render({ onClick: vi.fn(), title: 'Add remarks', onMouseEnter }, ref);
  expect(element.props['aria-label']).toBe('Add remarks');
  expect(element.ref).toBe(ref);
  expect(element.props.onMouseEnter).toBe(onMouseEnter);
});
