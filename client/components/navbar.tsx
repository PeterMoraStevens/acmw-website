import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";

const Navbar = () => {
  return (
    <div className="z-99 flex p-4 gap-4 sticky top-0 bg-background border-border border-b-2">
      <Link href={"/"}>
        <Button className="ml-2">Home</Button>
      </Link>
      <Link href={"/blog"}>
        <Button>Blog</Button>
      </Link>
      <Link href={"/events"}>
        <Button>Events</Button>
      </Link>
      <Link href={"/officers"}>
        <Button>Officers</Button>
      </Link>
    </div>
  );
};

export default Navbar;
