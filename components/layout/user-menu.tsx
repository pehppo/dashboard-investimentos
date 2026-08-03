"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Share2, User, Users } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ label }: { label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground">
        <User className="size-4" />
        <span className="hidden max-w-32 truncate sm:inline">{label}</span>
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/compartilhamento">
            <Share2 className="size-4" />
            Compartilhamento
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/compartilhado-comigo">
            <Users className="size-4" />
            Compartilhado comigo
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
