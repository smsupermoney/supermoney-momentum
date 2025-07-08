
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from 'lucide-react';
import { firebaseEnabled, auth, GoogleAuthProvider, signInWithPopup } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<{ title: string; description: React.ReactNode } | null>(null);

  const handleGoogleSignIn = async () => {
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Firebase Not Configured',
            description: 'Authentication is not properly configured. Please check your Firebase setup.',
        });
        return;
    }

    setIsLoading(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // onAuthStateChanged in AppContext will handle the redirect
      router.replace('/dashboard');
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let toastDescription = error.message || 'An unknown error occurred.';

      if (error.code === 'auth/unauthorized-domain') {
        const hostname = window.location.hostname;
        const origin = window.location.origin;
        setAuthError({
          title: "Domain Not Authorized",
          description: (
            <div className="text-xs space-y-2">
              <p>To fix this, you must authorize this app's domain in your Firebase project settings:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to **Firebase Console → Authentication → Settings**.</li>
                <li>Under **Authorized domains**, add: <code className="bg-muted px-1 py-0.5 rounded">{hostname}</code></li>
                <li>Go to **Sign-in method → Google**.</li>
                <li>Under **Authorized redirect URIs**, add: <code className="bg-muted px-1 py-0.5 rounded">{`${origin}/__/auth/handler`}</code></li>
              </ol>
            </div>
          )
        });
        toastDescription = "This app's domain is not authorized. See message below for instructions."

      } else if (error.code === 'auth/popup-closed-by-user') {
        toastDescription = 'The sign-in popup was closed before completing. Please try again.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        toastDescription = 'Sign-in cancelled. You can try again at any time.';
      } else if (error.code === 'auth/configuration-not-found') {
        toastDescription = 'Google Sign-In is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.';
      } else if (error.message.includes('a parameter or an operation is not supported')) {
        toastDescription = 'A browser-related issue occurred. Refreshing the page and trying again often resolves this.';
      }

      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: toastDescription,
        duration: 9000,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('login.title')}</CardTitle>
          <CardDescription>
              Use your company Google account to sign in. There is no separate password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authError && (
             <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{authError.title}</AlertTitle>
              <AlertDescription>{authError.description}</AlertDescription>
            </Alert>
          )}
          
          <Button onClick={handleGoogleSignIn} className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in with Google
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
