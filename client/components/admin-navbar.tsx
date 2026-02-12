"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Menu, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const DesktopNavbar = () => {
  const url = usePathname();

  return (
    <div className="z-50 gap-4 fixed left-0 top-0 mx-auto flex h-17.5 w-full items-center border-b-4 border-border bg-background px-5">
      <Link href={"/"}>
        <Button
          className={url === "/" ? "ml-2 bg-secondary-background" : "ml-2"}
        >
          Home
        </Button>
      </Link>
      <Link href={"/admin/events/"}>
        <Button
          className={url === "/admin/events" ? "bg-secondary-background" : ""}
        >
          Manage Events
        </Button>
      </Link>
      <Link href={"/admin/officers/"}>
        <Button
          className={url === "/admin/officers" ? "bg-secondary-background" : ""}
        >
          Manage Officers
        </Button>
      </Link>
      <Link href={"/admin/resources/"}>
        <Button
          className={
            url === "/admin/resources" ? "bg-secondary-background" : ""
          }
        >
          Manage Resources
        </Button>
      </Link>
      <Link href={"/admin/sponsor/"}>
        <Button
          className={url === "/admin/sponsor" ? "bg-secondary-background" : ""}
        >
          Manage Sponsor
        </Button>
      </Link>
      <Button
        className="ml-auto mr-2"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="h-4 w-4 mr-1" />
        Sign Out
      </Button>
    </div>
  );
};

const MobileNavbar = () => {
  const url = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="z-49 left-0 top-0 mx-auto flex h-17.5 w-full items-center border-b-4 border-border bg-secondary-background px-5">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size={"icon"}>
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="z-49 bg-secondary-background">
          <DropdownMenuItem className="bg-secondary-background">
            <Link href={"/"}>
              <Button
                className={url === "/" ? "bg-secondary-background" : ""}
                onClick={() => setOpen((prev) => !prev)}
              >
                Home
              </Button>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="bg-secondary-background">
            <Link href={"/admin/events/"}>
              <Button
                className={url === "/events" ? "bg-secondary-background" : ""}
                onClick={() => setOpen((prev) => !prev)}
              >
                Events
              </Button>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="bg-secondary-background">
            <Link href={"/admin/officers/"}>
              <Button
                className={
                  url === "/admin/officers" ? "bg-secondary-background" : ""
                }
                onClick={() => setOpen((prev) => !prev)}
              >
                Officers
              </Button>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="bg-secondary-background">
            <Link href={"/resources/"}>
              <Button
                className={
                  url === "/admin/resources" ? "bg-secondary-background" : ""
                }
                onClick={() => setOpen((prev) => !prev)}
              >
                Resources
              </Button>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="bg-secondary-background">
            <Link href={"/sponsor/"}>
              <Button
                className={
                  url === "/admin/sponsor" ? "bg-secondary-background" : ""
                }
                onClick={() => setOpen((prev) => !prev)}
              >
                Sponsor
              </Button>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="bg-secondary-background">
            <Button onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const AdminNavbar = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile ? <MobileNavbar /> : <DesktopNavbar />;
};

export default AdminNavbar;
