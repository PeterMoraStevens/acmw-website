import Star22 from "@/components/stars/s22";
import Star9 from "@/components/stars/s9";
import Marquee from "@/components/ui/marquee";
import React from "react";
import { Highlighter } from "@/components/ui/highlighter";

const Page = () => {
  return (
    <div className="min-h-screen bg-size-[70px_70px] prose-h4:xl:text-2xl prose-h4:lg:text-xl prose-h4:text-lg">
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
              ACMW
            </Highlighter>
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
      </div>
    </div>
  );
};

export default Page;
