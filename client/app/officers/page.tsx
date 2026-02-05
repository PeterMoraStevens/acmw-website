/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import React from "react";

const Page = () => {
  type officer = {
    name: string;
    major?: string;
    minor?: string;
    internship?: string;
    hobbies?: string;
    img: string;
    role: string;
    bio: string;
    email?: string;
    linkedin?: string;
  };

  const officers: officer[] = [
    {
      name: "Heidi",
      img: "idk",
      role: "President",
      bio: "Heidi started at OSU...",
    },
    {
      name: "Jamie",
      img: "idk",
      role: "Vice-President",
      bio: "Jamie started at OSU...",
    },
    {
      name: "Lauren",
      img: "idk",
      role: "Secretary",
      bio: "Lauren started at OSU...",
    },
    {
      name: "Carlana",
      img: "idk",
      role: "Treasurer",
      bio: "Carlana started at OSU...",
    },
    {
      name: "Sandra",
      img: "idk",
      role: "Funding Cordinator",
      bio: "Sandra started at OSU...",
    },
    {
      name: "Rithika",
      img: "idk",
      role: "Co-Event Cordinator",
      bio: "Rithika started at OSU...",
    },
    {
      name: "Grace",
      img: "idk",
      role: "Co-Event Cordinator",
      bio: "Grace started at OSU...",
    },
    {
      name: "Mack",
      img: "idk",
      role: "Hackathon Cordinator",
      bio: "Mack started at OSU...",
    },
    {
      name: "Tiffany",
      img: "idk",
      role: "Public Relations",
      bio: "Tiffany started at OSU...",
    },
    {
      name: "Whitney",
      img: "idk",
      role: "Historian",
      bio: "Whitney started at OSU...",
    },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-6 p-6 mt-18">
      {officers.map((officer) => (
        <Dialog key={officer.name}>
          <DialogTrigger asChild>
            <Card className="w-full max-w-sm hover:cursor-pointer text-center">
              <CardHeader>
                <CardTitle>{officer.name}</CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col items-center gap-2">
                <img
                  src={officer.img}
                  alt={`Image of ${officer.name}`}
                  className="w-32 h-32 rounded-full border shadow-md object-cover"
                />
                {officer.role}
              </CardContent>
            </Card>
          </DialogTrigger>

          <DialogContent className="flex flex-col items-center text-center sm:max-w-lg">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-3xl">{officer.name}</DialogTitle>

              <DialogDescription className="flex flex-col items-center gap-4">
                <img
                  src={officer.img}
                  alt={`Image of ${officer.name}`}
                  className="w-32 h-32 rounded-full border shadow-md object-cover"
                />

                <p className="font-semibold">{officer.role}</p>

                <p className="text-muted-foreground">{officer.bio}</p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};

export default Page;
