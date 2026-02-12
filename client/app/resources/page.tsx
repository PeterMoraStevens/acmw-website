"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

type Resource = {
  id: string;
  title: string;
  description: string;
  url: string;
};

type ResourceCategory = {
  id: string;
  name: string;
  order: number;
  resources: Resource[];
};

const Page = () => {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const snapshot = await getDocs(collection(db, "resourceCategories"));
        const data: ResourceCategory[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ResourceCategory, "id">),
        }));
        data.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
        setCategories(data);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-10 text-lg">
        Loading resources...
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex justify-center p-10 text-lg text-muted-foreground mt-18">
        No resources available yet.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 mt-18">
      <h1 className="text-3xl font-bold mb-6">Resources</h1>

      <Accordion type="multiple" defaultValue={categories.map((c) => c.id)}>
        {categories.map((category) => (
          <AccordionItem key={category.id} value={category.id} className="mb-4">
            <AccordionTrigger className="text-xl font-semibold">
              {category.name}
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3 pt-2">
                {category.resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{resource.title}</p>
                            {resource.description && (
                              <p className="text-sm text-muted-foreground">
                                {resource.description}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 shrink-0 mt-1 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
                {category.resources.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No resources in this category yet.
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Page;
