import React from 'react';
import { Routes } from 'react-router-dom';
import { getRoleHome, getRolePath } from '../pages/auth/role-home.js';
import { canAccessRoute } from '../pages/auth/role-access.js';

// Register role URLs for shared pages while retaining old links as redirects.
export function createRoleRoutes(children, role) {
  const routes = React.Children.toArray(children);
  const paths = new Set(routes.map(route => route.props.path));
  const home = getRoleHome(role);
  if (!home) return routes;
  const aliases = [];
  for (const route of routes) {
    const { path, element } = route.props;
    if (!path?.startsWith('/') || !element?.props.allowedRoles) continue;
    if (!canAccessRoute(role, element.props.allowedRoles, path)) continue;
    const target = getRolePath(role, path);
    if (paths.has(target)) continue;
    paths.add(target);
    aliases.push(React.cloneElement(route, { key: target, path: target }));
  }
  return [...routes, ...aliases];
}

export default function RoleRoutes({ children, role }) {
  return <Routes>{createRoleRoutes(children, role)}</Routes>;
}
