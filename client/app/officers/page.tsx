/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

import { collection, getDocs } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";

type Officer = {
  id: string;
  name: string;
  role: string;
  bio: string;
  img: string;
  major?: string;
  minor?: string;
  hobbies?: string;
  responsibilities?: string;
  linkedin?: string;
  email?: string;
  websiteUrl?: string;
  socialUrl?: string;
  order?: number;
};

const Page = () => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOfficers() {
      try {
        const snapshot = await getDocs(collection(db, "officers"));

        const officerData: Officer[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Officer, "id">),
        }));

        officerData.sort(
          (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity),
        );
        setOfficers(officerData);
      } catch (error) {
        console.error("Error fetching officers:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOfficers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-10 text-lg">
        Loading officers...
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-6 p-6 mt-18">
      {officers.map((officer) => (
        <Dialog key={officer.id}>
          <DialogTrigger asChild>
            <Card className="w-full max-w-sm hover:cursor-pointer text-center">
              <CardHeader>
                <CardTitle>{officer.name}</CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col items-center gap-2">
                <Image
                  height={192}
                  width={192}
                  src={officer.img}
                  alt={`Image of ${officer.name}`}
                  className="w-48 h-48 rounded-full border-2 border-border shadow-md object-cover"
                />
                <p className="font-semibold">{officer.role}</p>
              </CardContent>
            </Card>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader className="items-center text-center">
              <Image
                height={240}
                width={240}
                src={officer.img}
                alt={`Image of ${officer.name}`}
                className="rounded-full shadow-lg object-cover border-2 border-border"
              />
              <DialogTitle className="text-2xl pt-2">
                {officer.name}
              </DialogTitle>
              <p className="text-sm font-semibold text-purple-600">
                {officer.role}
              </p>
            </DialogHeader>

            <DialogDescription asChild>
              <div className="flex flex-col gap-4 pt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {officer.bio}
                </p>

                {(officer.major || officer.minor) && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {officer.major && (
                      <div>
                        <span className="font-semibold">Major</span>
                        <p className="text-muted-foreground">{officer.major}</p>
                      </div>
                    )}
                    {officer.minor && (
                      <div>
                        <span className="font-semibold">Minor</span>
                        <p className="text-muted-foreground">{officer.minor}</p>
                      </div>
                    )}
                  </div>
                )}

                {officer.responsibilities && (
                  <div className="text-sm">
                    <span className="font-semibold">Responsibilities</span>
                    <p className="text-muted-foreground">
                      {officer.responsibilities}
                    </p>
                  </div>
                )}

                {officer.hobbies && (
                  <div className="text-sm">
                    <span className="font-semibold">Hobbies</span>
                    <p className="text-muted-foreground">{officer.hobbies}</p>
                  </div>
                )}

                {(officer.linkedin ||
                  officer.email ||
                  officer.websiteUrl ||
                  officer.socialUrl) && (
                  <div className="flex flex-wrap justify-center gap-2 pt-1 border-t">
                    {officer.linkedin && (
                      <a
                        href={officer.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        LinkedIn
                      </a>
                    )}
                    {officer.email && (
                      <a
                        href={`mailto:${officer.email}`}
                        className="mt-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        Email
                      </a>
                    )}
                    {officer.websiteUrl && (
                      <a
                        href={officer.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        Website
                      </a>
                    )}
                    {officer.socialUrl && (
                      <a
                        href={officer.socialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        Socials
                      </a>
                    )}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};

export default Page;
