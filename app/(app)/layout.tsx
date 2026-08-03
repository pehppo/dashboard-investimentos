import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MainNav } from "@/components/layout/main-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NewInvestmentButton } from "@/components/investments/new-investment-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <span className="order-1 flex items-center gap-2 font-heading font-semibold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-4" />
            </span>
            Investimentos
          </span>
          <div className="order-2 flex items-center gap-2 sm:order-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {profile?.display_name ?? user?.email}
            </span>
            <NewInvestmentButton variant="icon" />
            <ThemeToggle />
            <SignOutButton />
          </div>
          <div className="order-3 w-full overflow-x-auto sm:order-2 sm:w-auto">
            <MainNav />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-8 sm:pb-24">
        {children}
      </main>
      <NewInvestmentButton />
    </div>
  );
}
