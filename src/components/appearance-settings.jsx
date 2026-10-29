import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card.jsx';
import ThemeSwitcher from './theme-switcher.jsx';

export default function AppearanceSettings() {
  return <Card className="mb-6 max-w-[880px]">
    <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Choose your workspace color mode.</CardDescription></CardHeader>
    <CardContent><div className="flex items-center justify-between gap-4"><span className="text-sm font-medium">Color mode</span><ThemeSwitcher /></div></CardContent>
  </Card>;
}