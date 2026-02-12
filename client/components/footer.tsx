"use client";

import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";

const Footer = () => {
  const url = usePathname();
  const pageUrl = url.split("/").pop() || "events";

  return (
    <div className="flex justify-between w-full h-16 border-t-border border-t-2 p-4 bg-background">
      <div className="">ACM-W @ OSU</div>
      <Link className="hover:underline" href={`/admin/${pageUrl}`}>
        Manage Website
      </Link>
    </div>
  );
};

export default Footer;
