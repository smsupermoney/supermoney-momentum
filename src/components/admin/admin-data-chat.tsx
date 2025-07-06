'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { generateReport, GenerateReportOutput } from '@/ai/flows/generate-report-flow';
import { useToast } from '@/hooks/use-toast';

export function AdminDataChat() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<GenerateReportOutput | null>(null);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setResult(null);
        try {
            const response = await generateReport(query);
            setResult(response);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'The AI model could not process your request. Please try rephrasing your question.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <CardTitle>Chat with your Data</CardTitle>
                </div>
                <CardDescription>Ask a question about your sales data and get an instant analysis.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                    <Input 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., What was our total deal value last month?"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Ask"}
                    </Button>
                </form>

                {isLoading && (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-4 text-muted-foreground">Analyzing...</p>
                    </div>
                )}

                {result && (
                    <Card className="bg-secondary">
                        <CardHeader>
                            <CardTitle className="text-lg">{result.reportTitle}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-base">{result.insight}</p>
                            {result.query && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Generated Query Plan:</p>
                                    <pre className="mt-2 p-4 bg-background rounded-md text-xs overflow-x-auto">
                                        {JSON.stringify(result.query, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
    );
}
