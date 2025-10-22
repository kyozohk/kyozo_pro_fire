'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MigrateImagesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleMigration = async () => {
    setIsLoading(true);
    setLogs([]);
    setError(null);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    try {
        addLog("Starting bulk image migration process...");
        const response = await fetch('/api/migrate-all-images', {
            method: 'POST'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'The migration request failed.');
        }
        
        const data = await response.json();

        data.logs.forEach((log: string) => addLog(log));
        
        addLog("Migration process finished.");
        if (data.errorCount > 0) {
            setError(`Migration completed with ${data.errorCount} errors. Please check the logs.`);
        }

    } catch (e: any) {
        addLog(`FATAL ERROR: ${e.message}`);
        setError(e.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body p-4 md:p-8">
        <header className="max-w-4xl mx-auto mb-8">
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Main View
            </Link>
             <h1 className="text-4xl font-headline font-bold">Admin Utilities</h1>
        </header>

        <main className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Bulk Image Migrator</CardTitle>
                    <CardDescription>
                        This tool will scan all communities in Firestore. For each community, it checks the 'communityProfileImage' and 'logo' fields. If an image URL is not already in the new Firebase Storage bucket, it will be automatically migrated.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-start gap-4">
                        <Button onClick={handleMigration} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Migrating...
                                </>
                            ) : (
                                "Start Image Migration"
                            )}
                        </Button>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>

                    {logs.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-semibold mb-2">Migration Logs</h3>
                            <pre className="p-4 bg-muted rounded-md text-card-foreground overflow-auto text-sm font-code h-96">
                                {logs.join('\n')}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
