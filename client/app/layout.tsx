import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Grainient from "@/components/Grainient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACMW @ OSU",
  description:
    "ACMW @ OSU is dedicate to fostering diversity in tech and supporting all in underrepresented groups",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="fixed inset-0 -z-10">
          <Grainient
            color1="#2780F5"
            color2="#E1EAF7"
            color3="#A8CBFF"
            timeSpeed={0.45}
            colorBalance={0}
            warpStrength={1.5}
            warpFrequency={5}
            warpSpeed={3.5}
            warpAmplitude={60}
            blendAngle={55}
            blendSoftness={0.05}
            rotationAmount={700}
            noiseScale={2}
            grainAmount={0.125}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>

        <Navbar />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
