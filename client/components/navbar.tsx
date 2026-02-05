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
import { Menu } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { usePathname } from "next/navigation";

const DesktopNavbar = () => {
  const url = usePathname();

  return (
    <div className="z-48 flex p-4 gap-4 sticky top-0 bg-background border-border border-b-2">
      <Link href={"/"}>
        <Button
          className={url === "/" ? "ml-2 bg-secondary-background" : "ml-2"}
        >
          Home
        </Button>
      </Link>
      <Link href={"/events/"}>
        <Button className={url === "/events" ? "bg-secondary-background" : ""}>
          Events
        </Button>
      </Link>
      <Link href={"/officers/"}>
        <Button
          className={url === "/officers" ? "bg-secondary-background" : ""}
        >
          Officers
        </Button>
      </Link>
      <Link href={"/resources/"}>
        <Button
          className={url === "/resources" ? "bg-secondary-background" : ""}
        >
          Resources
        </Button>
      </Link>
      <Link href={"/sponsor/"}>
        <Button className={url === "/sponsor" ? "bg-secondary-background" : ""}>
          Sponsor
        </Button>
      </Link>
    </div>
  );
};

const MobileNavbar = () => {
  const url = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="z-49 flex p-4 gap-4 sticky top-0 bg-background border-border border-b-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size={"icon"}>
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="z-49 bg-secondary-background">
          <DropdownMenuItem
            className="bg-secondary-background"
            onClick={() => setOpen((prev) => !prev)}
          >
            <Link href={"/"}>
              <Button className={url === "/" ? "bg-secondary-background" : ""}>
                Home
              </Button>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="bg-secondary-background">
            <Link href={"/events/"}>
              <Button
                className={url === "/events" ? "bg-secondary-background" : ""}
                onClick={() => setOpen((prev) => !prev)}
              >
                Events
              </Button>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="bg-secondary-background">
            <Link href={"/officers/"}>
              <Button
                className={url === "/officers" ? "bg-secondary-background" : ""}
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
                  url === "/resources" ? "bg-secondary-background" : ""
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
                className={url === "/sponsor" ? "bg-secondary-background" : ""}
                onClick={() => setOpen((prev) => !prev)}
              >
                Sponsor
              </Button>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const Navbar = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile ? <MobileNavbar /> : <DesktopNavbar />;
};

export default Navbar;
