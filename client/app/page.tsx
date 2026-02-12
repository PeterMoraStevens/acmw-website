/* eslint-disable @next/next/no-img-element */
"use client";

import Star22 from "@/components/stars/s22";
import Star9 from "@/components/stars/s9";
import Marquee from "@/components/ui/marquee";
import { useEffect, useState } from "react";
import { Highlighter } from "@/components/ui/highlighter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import {
  Users,
  Calendar,
  Briefcase,
  GraduationCap,
  Code,
  Heart,
} from "lucide-react";

type Sponsor = {
  id: string;
  name: string;
  logo: string;
  website?: string;
  order?: number;
};

const features = [
  {
    icon: Users,
    title: "Community & Belonging",
    description:
      "We create a welcoming space for underrepresented groups in computing. Our weekly meetings help members build genuine connections and find their people in the tech world.",
  },
  {
    icon: Calendar,
    title: "Workshops & Skill Building",
    description:
      "From resume reviews to hands-on interview workshops, we equip members with practical skills that go beyond the classroom. We host events which are designed to help you grow as both a developer and a professional.",
  },
  {
    icon: Briefcase,
    title: "Networking & Career Development",
    description:
      "We connect students directly with industry professionals through panel events, alumni speakers, and company info sessions. Many companies which present at ACM-W also hire from Oregon State University.",
  },
  {
    icon: Code,
    title: "Hackathons & Projects",
    description:
      "We host Figma hackathons and encourage collaborative side projects through project showcases. Whether you're a beginner or experienced, we'll help you find teammates and build something you're proud of.",
  },
];

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
      <div className="flex flex-col items-center min-h-screen">
        {/* Hero */}
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
            is dedicated to fostering diversity in tech and supporting all in
            underrepresented groups
          </p>
          <Star22 className="text-main ml-auto w-10 h-10" />
        </div>

        {/* Marquee */}
        <Marquee
          items={[
            "Meets Monday 6-7pm",
            "Helps Students in Computer Science",
            "Networking and Professional Events",
          ]}
        />

        {/* What We Do — alternating feature sections */}
        <div className="w-full max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-4">
            What We{" "}
            <Highlighter
              action="box"
              color="#5294ff"
              strokeWidth={2}
              iterations={2}
              isView
            >
              Do
            </Highlighter>
          </h2>
          <p className="text-center text-lg mb-12 max-w-2xl mx-auto">
            ACM-W @ Oregon State empowers students through community, education,
            and professional development.
          </p>

          <div className="flex flex-col gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={feature.title}
                  className={`flex flex-col md:flex-row items-center gap-6 bg-secondary-background border-2 border-border rounded-base shadow-shadow p-6 md:p-8 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className="shrink-0 w-20 h-20 rounded-base bg-main border-2 border-border flex items-center justify-center shadow-shadow">
                    <Icon className="w-10 h-10 text-main-foreground" />
                  </div>
                  <div
                    className={`flex-1 ${
                      isEven ? "md:text-left" : "md:text-right"
                    } text-center`}
                  >
                    <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-base leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="w-full bg-main border-t-2 border-b-2 border-border py-12">
          <div className="max-w-3xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold text-main-foreground mb-4">
              Ready to Join?
            </h2>
            <p className="text-lg text-main-foreground mb-6">
              Come to a meeting, meet the community, and find your place in
              tech. No experience necessary — just bring yourself.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="neutral" size="lg" asChild>
                <Link href="/events">View Events</Link>
              </Button>
              <Button variant="neutral" size="lg" asChild>
                <Link href="/officers">Meet the Team</Link>
              </Button>
            </div>
          </div>
        </div>

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
