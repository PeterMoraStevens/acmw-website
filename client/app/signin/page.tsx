"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const error = searchParams.get("error");

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Sign in to ACM-W</CardTitle>
            <p className="text-muted-foreground mt-2">
              Sign in with your Google account to continue.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 w-full text-center">
                {error === "OAuthAccountNotLinked"
                  ? "This email is already linked to another account."
                  : "Something went wrong. Please try again."}
              </p>
            )}

            <Button
              className="w-full"
              onClick={() => signIn("google", { callbackUrl })}
            >
              <LogIn className="mr-2 w-4 h-4" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
