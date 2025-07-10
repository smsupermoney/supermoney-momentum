
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from 'lucide-react';
import { firebaseEnabled, auth, GoogleAuthProvider, signInWithPopup, firebaseConfig } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigValid, setIsConfigValid] = useState(true);

  useEffect(() => {
    // This check is crucial for a smooth developer experience.
    // It verifies that the Firebase environment variables are populated.
    if (firebaseEnabled && (!firebaseConfig.apiKey || !firebaseConfig.projectId)) {
      setIsConfigValid(false);
    }
  }, []);


  const handleGoogleSignIn = async () => {
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Firebase Not Configured',
            description: 'Authentication is not properly configured. Please contact support.',
        });
        return;
    }

    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // The onAuthStateChanged listener in AppContext will handle the redirect upon success.
      await signInWithPopup(auth, provider);
      router.replace('/dashboard');
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      
      // Provide a generic but helpful error message for various sign-in failures.
      let toastDescription = 'An unknown error occurred. Please try again or check your network connection.';
      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            toastDescription = 'The sign-in popup was closed before completing. If this happens instantly, please ensure your domain is authorized in the Firebase console and the user account exists in the CRM.';
            break;
          case 'auth/cancelled-popup-request':
            toastDescription = 'Sign-in cancelled. You can try again at any time.';
            break;
          case 'auth/unauthorized-domain':
            toastDescription = "This app's domain is not authorized. Please go to your Firebase Console -> Authentication -> Sign-in method -> Google and add this domain to the list of authorized domains.";
            break;
           case 'auth/configuration-not-found':
            toastDescription = 'Google Sign-In is not enabled for this project. Please contact your administrator.';
            break;
        }
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
    <div className="w-full space-y-6 rounded-lg border bg-card p-6 text-center shadow-sm" autoComplete="off">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sign In to Supermoney</h2>
        <p className="mt-2 text-sm text-muted-foreground">
            Use your company Google account to sign in.
        </p>
      </div>
      
      {!isConfigValid && (
          <Alert variant="destructive" className="text-left">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Firebase Configuration Error</AlertTitle>
            <AlertDescription>
                Your Firebase environment variables are not set correctly. Please copy the values from your Firebase project settings into your <code>.env</code> file and restart the application.
            </AlertDescription>
          </Alert>
      )}
      
      <Button onClick={handleGoogleSignIn} className="w-full" disabled={isLoading || !isConfigValid}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in with Google
      </Button>
    </div>
  );
}
