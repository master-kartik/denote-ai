import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase-client";

type GoogleLoginButtonProps = {
  label: string;
  onClick: () => void;
};

function GoogleLoginButton({ label, onClick }: GoogleLoginButtonProps) {
  return (
    <Button onClick={onClick} variant="outline" className="w-full">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2">
        <path
          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
          fill="currentColor"
        />
      </svg>
      {label} with Google
    </Button>
  );
}

type EmailPasswordFormProps = {
  email: string;
  password: string;
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
};

function EmailPasswordForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  submitLabel,
}: EmailPasswordFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={onEmailChange}
            required
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={onPasswordChange}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

type ToggleAuthModeLinkProps = {
  isSignUp: boolean;
  onToggle: () => void;
};

function ToggleAuthModeLink({ isSignUp, onToggle }: ToggleAuthModeLinkProps) {
  return (
    <div className="text-center text-sm">
      {isSignUp ? "Already have an account? " : "Don't have an account? "}
      <a
        onClick={onToggle}
        href="#"
        className="underline underline-offset-4"
      >
        {isSignUp ? "Login" : "Sign Up"}
      </a>
    </div>
  );
}

export function Auth({ className, ...props }: React.ComponentProps<"div">) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLabel, setLoginLabel] = useState("Login");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoginLabel(isSignUp ? "Sign Up" : "Login");
  }, [isSignUp]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      setErrorMsg("Google sign-in failed");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setErrorMsg("Sign up failed");
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setErrorMsg("Sign in failed");
        return;
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto px-4", className)} {...props}>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome to DenoteAI</CardTitle>
          <CardDescription>
            {loginLabel} with your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <GoogleLoginButton label={loginLabel} onClick={handleGoogleLogin} />
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>
            {errorMsg && (
              <div className="text-red-500 text-center" role="alert">
                {errorMsg}
              </div>
            )}
            <EmailPasswordForm
              email={email}
              password={password}
              onEmailChange={(e) => setEmail(e.target.value)}
              onPasswordChange={(e) => setPassword(e.target.value)}
              onSubmit={handleSubmit}
              submitLabel={loginLabel}
            />
            <ToggleAuthModeLink
              isSignUp={isSignUp}
              onToggle={() => setIsSignUp((prev) => !prev)}
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our <a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a>{" "}
        and <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
      </div>
    </div>
  );
}