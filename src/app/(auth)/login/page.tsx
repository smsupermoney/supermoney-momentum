
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { firebaseEnabled, auth, GoogleAuthProvider, signInWithPopup } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, users } = useApp();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<{ title: string; description: React.ReactNode } | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });
  
  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged in AppContext will handle the redirect
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

      } else if (error.code === 'auth/configuration-not-found') {
        toastDescription = 'Google Sign-In is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.';
      }

      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: toastDescription,
        duration: 9000,
      });
      setIsLoading(false);
    }
  };


  const onMockSubmit = (values: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    const success = login(values.email, values.password);

    if (success) {
      router.replace('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
      });
      setIsLoading(false);
    }
  };
  
  const handleMockUserSelect = (email: string) => {
      form.setValue('email', email);
      const user = users.find(u => u.email === email);
      if(user) {
          const success = login(email, 'test123');
           if (success) {
              router.replace('/dashboard');
            }
      }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('login.title')}</CardTitle>
          <CardDescription>
              {firebaseEnabled
                ? 'Use your company Google account to sign in. There is no separate password.'
                : t('login.description')}
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
          {firebaseEnabled ? (
            <Button onClick={handleGoogleSignIn} className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in with Google
            </Button>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onMockSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.emailLabel')}</FormLabel>
                       <Select onValueChange={handleMockUserSelect} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a demo user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.uid} value={user.email}>
                              {user.name} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.passwordLabel')}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} value="test123" readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('login.button')}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      {!firebaseEnabled && (
        <Card>
          <CardHeader>
              <CardTitle className="text-base">{t('login.demoAccounts')}</CardTitle>
              <CardDescription className="text-xs">{t('login.demoDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
              <ul className="space-y-2 text-sm">
                  {users.map(user => (
                      <li key={user.uid}>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-muted-foreground">Role: {user.role}</p>
                      </li>
                  ))}
              </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
