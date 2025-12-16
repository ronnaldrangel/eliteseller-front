"use client";

import * as React from "react";
import md5 from "blueimp-md5";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function SelectUserAvatarMenu() {
  const { data: session } = useSession();

  const email = (session?.user?.email || "").trim().toLowerCase();
  const name = session?.user?.name || session?.user?.email || "Usuario";
  const gravatarUrl = email
    ? `https://www.gravatar.com/avatar/${md5(email)}?d=retro`
    : undefined;

  const initials = React.useMemo(() => {
    if (name && name.trim().length > 0) {
      return name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return (email[0] || "U").toUpperCase();
  }, [name, email]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={name}
          className="inline-flex items-center gap-2 rounded-md border bg-background px-2 py-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="h-8 w-8">
            {gravatarUrl && <AvatarImage src={gravatarUrl} alt={name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-sm font-medium">{name}</span>
            {email && <span className="text-xs text-muted-foreground">{email}</span>}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
        <DropdownMenuLabel className="leading-tight">
          <div className="font-medium">{name}</div>
          {email && <div className="text-xs text-muted-foreground">{email}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="transition-colors cursor-pointer" asChild>
          <Link href="/select">Inicio</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="transition-colors cursor-pointer" asChild>
          <Link href="/account">Mi cuenta</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="transition-colors cursor-pointer" asChild>
          <Link href="/billing">Facturación</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="transition-colors cursor-pointer" asChild>
          <Link href="/affiliates">Afiliados</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/login" })}>
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}