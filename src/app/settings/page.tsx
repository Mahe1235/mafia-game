'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Get the current theme from localStorage or default to dark
    const currentTheme = localStorage.getItem('theme') || 'dark';
    setTheme(currentTheme);
    
    // Apply the theme to the HTML element
    document.documentElement.className = currentTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
  };

  return (
    <div className="min-h-screen p-4">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Settings</h1>
          <p className="text-muted-foreground">Customize your game experience</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Manage your theme preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Theme</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose between dark and light theme
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Font Size</h3>
                  <p className="text-sm text-muted-foreground">
                    Adjust the text size for better readability
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">-</Button>
                  <Button variant="outline" size="sm">Reset</Button>
                  <Button variant="outline" size="sm">+</Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
          </CardFooter>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Game Preferences</CardTitle>
            <CardDescription>Customize gameplay settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sound Effects</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable game sound effects
                  </p>
                </div>
                <Button variant="outline">
                  Enabled
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Animations</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable UI animations
                  </p>
                </div>
                <Button variant="outline">
                  Enabled
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
} 