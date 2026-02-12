/* eslint-disable @next/next/no-img-element */
"use client";

import Star22 from "@/components/stars/s22";
import Star9 from "@/components/stars/s9";
import Marquee from "@/components/ui/marquee";
import { useEffect, useState } from "react";
import { Highlighter } from "@/components/ui/highlighter";
import MagicBento from "@/components/MagicBento";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

type Sponsor = {
  id: string;
  name: string;
  logo: string;
  website?: string;
  order?: number;
};

const Page = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    async function fetchSponsors() {
      try {
        const snapshot = await getDocs(collection(db, "sponsors"));
        const data: Sponsor[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Sponsor, "id">),
        }));
        data.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
        setSponsors(data);
      } catch (err) {
        console.error("Error fetching sponsors:", err);
      }
    }
    fetchSponsors();
  }, []);

  return (
    <div className="min-h-screen bg-size-[70px_70px] prose-h4:xl:text-2xl prose-h4:lg:text-xl prose-h4:text-lg mt-20">
      <div className="flex flex-col  items-center min-h-screen">
        <div className="sm:max-w-[50%] text-center m-4 my-36 bg-secondary-background p-4 rounded-2xl shadow-shadow border-border border-2">
          <Star9 className="w-12 h-12 text-main" />
          <h1 className="text-6xl">
            <Highlighter
              action="underline"
              color="#5294ff"
              strokeWidth={3}
              iterations={3}
            >
              ACM-W
            </Highlighter>{" "}
            @ OSU
          </h1>
          <p className="text-2xl">
            is dedicate to fostering diversity in tech and supporting all in
            underrepresented groups
          </p>
          <Star22 className="text-main ml-auto w-10 h-10" />
        </div>

        <Marquee
          items={[
            "Meets Monday 6-7pm",
            "Helps Students in Computer Science",
            "Networking and Professional Events",
          ]}
        />

        <div className="w-full">
          <h2>Supporting Underrepresented</h2>
        </div>

        {/* <MagicBento
          textAutoHide={true}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect
          spotlightRadius={400}
          particleCount={12}
          glowColor="66, 135, 245"
          disableAnimations={false}
        /> */}

        {/* Sponsors section */}
        {sponsors.length > 0 && (
          <div className="w-full max-w-4xl mx-auto px-4 py-12 mt-8">
            <h2 className="text-2xl font-bold text-center mb-6">
              Our Sponsors
            </h2>
            <div className="flex flex-wrap gap-8 items-center justify-center">
              {sponsors.map((sponsor) =>
                sponsor.website ? (
                  <a
                    key={sponsor.id}
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-secondary-background transition-colors"
                  >
                    <img
                      src={sponsor.logo}
                      alt={`${sponsor.name} logo`}
                      className="w-36 h-20 object-contain"
                    />
                    <span className="text-sm font-medium">{sponsor.name}</span>
                  </a>
                ) : (
                  <div
                    key={sponsor.id}
                    className="flex flex-col items-center gap-2 p-4"
                  >
                    <img
                      src={sponsor.logo}
                      alt={`${sponsor.name} logo`}
                      className="w-36 h-20 object-contain"
                    />
                    <span className="text-sm font-medium">{sponsor.name}</span>
                  </div>
                ),
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Interested in sponsoring?{" "}
              <Link href="/sponsor" className="text-blue-500 hover:underline">
                Learn more
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
