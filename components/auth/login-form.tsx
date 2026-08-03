"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm({ confirmado }: { confirmado?: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse seus investimentos</CardDescription>
      </CardHeader>
      <CardContent>
        {confirmado && (
          <p className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            Conta criada! Confirme seu e-mail antes de entrar.
          </p>
        )}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <GoogleSignInButton />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/signup" className="underline underline-offset-4">
            Cadastre-se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
