"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

type EventImage = {
  url: string;
  path: string;
};

type EventPost = {
  id: string;
  title: string;
  description: string;
  date: string;
  images: EventImage[];
  archived: boolean;
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const Page = () => {
  const [events, setEvents] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventPost | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const snapshot = await getDocs(collection(db, "events"));
        const data: EventPost[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<EventPost, "id">),
        }));

        const visible = data
          .filter((e) => !e.archived)
          .sort((a, b) => b.date.localeCompare(a.date));

        setEvents(visible);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Group events by year
  const eventsByYear = useMemo(() => {
    const grouped: Record<string, EventPost[]> = {};
    for (const event of events) {
      const year = event.date.slice(0, 4) || "Unknown";
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(event);
    }
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  }, [events]);

  if (loading) {
    return (
      <div className="flex justify-center p-10 text-lg">
        Loading events...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex justify-center p-10 text-lg text-muted-foreground mt-18">
        No events to show yet.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 mt-18">
      <h1 className="text-3xl font-bold mb-6">Events</h1>

      {/* Detail dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        {selectedEvent && (
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedEvent.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {formatDate(selectedEvent.date)}
              </p>
            </DialogHeader>

            <DialogDescription asChild>
              <div className="flex flex-col gap-4 pt-2">
                {selectedEvent.images.length > 1 ? (
                  <Carousel className="w-full px-10">
                    <CarouselContent>
                      {selectedEvent.images.map((img, i) => (
                        <CarouselItem key={img.path}>
                          <div className="bg-black/5 rounded-md overflow-hidden">
                            <Image
                              src={img.url}
                              alt={`${selectedEvent.title} photo ${i + 1}`}
                              width={800}
                              height={600}
                              className="w-full h-auto object-contain"
                              sizes="(max-width: 768px) 100vw, 672px"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0" />
                    <CarouselNext className="right-0" />
                  </Carousel>
                ) : selectedEvent.images.length === 1 ? (
                  <div className="bg-black/5 rounded-md overflow-hidden">
                    <Image
                      src={selectedEvent.images[0].url}
                      alt={selectedEvent.title}
                      width={800}
                      height={600}
                      className="w-full h-auto object-contain"
                      sizes="(max-width: 768px) 100vw, 672px"
                    />
                  </div>
                ) : null}

                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {selectedEvent.description}
                </p>
              </div>
            </DialogDescription>
          </DialogContent>
        )}
      </Dialog>

      {/* Year-grouped accordion */}
      <Accordion
        type="multiple"
        defaultValue={eventsByYear.length > 0 ? [eventsByYear[0][0]] : []}
      >
        {eventsByYear.map(([year, yearEvents]) => (
          <AccordionItem key={year} value={year} className="mb-4">
            <AccordionTrigger className="text-xl font-semibold">
              {year}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {yearEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedEvent(event)}
                  >
                    {event.images.length > 0 && (
                      <div className="bg-black/5 rounded-t-md overflow-hidden">
                        <Image
                          src={event.images[0].url}
                          alt={event.title}
                          width={400}
                          height={300}
                          className="w-full h-auto object-contain"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {event.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.date)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Page;
