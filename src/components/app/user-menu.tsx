"use client";

import { useTheme } from "@/components/theme";
import { LogOutIcon, MoonIcon, SunIcon, ChevronsUpDownIcon } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase("tr"))
    .join("");
}

export function UserMenu({ user, compact }: { user: { name: string; email: string }; compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-lg text-left transition-colors hover:bg-sidebar-accent",
          compact ? "size-9 justify-center p-0" : "px-2 py-2"
        )}
        aria-label="Kullanıcı menüsü"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-brand/15 text-xs font-semibold text-brand">{initials(user.name)}</AvatarFallback>
        </Avatar>
        {!compact && (
          <>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
            <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
          {resolvedTheme === "dark" ? "Açık tema" : "Koyu tema"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logoutAction()}>
          <LogOutIcon />
          Çıkış yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
