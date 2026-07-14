"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  "/slide.png",
  "/slide2.png",
  "/slide3.png",
  "/slide4.png",
];

// Replace this later if you have a cleaner transparent coin/hero image.
const desktopRicLogo = "/rc.png";

export default function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {/* Desktop hero */}
      <section className="relative hidden h-[255px] overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E14] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:block">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,201,40,0.08),transparent_58%)]" />
        <div className="absolute right-0 top-0 h-full w-[45%] bg-[radial-gradient(circle_at_80%_50%,rgba(255,201,40,0.14),transparent_45%)]" />

        <div className="absolute -right-10 top-[34%] h-[2px] w-[460px] rotate-[-17deg] bg-gradient-to-r from-transparent via-[#FFC928]/45 to-transparent blur-[1px]" />
        <div className="absolute -right-8 top-[50%] h-[2px] w-[430px] rotate-[-7deg] bg-gradient-to-r from-transparent via-[#FFC928]/35 to-transparent blur-[1px]" />
        <div className="absolute -right-8 top-[65%] h-[2px] w-[420px] rotate-[8deg] bg-gradient-to-r from-transparent via-[#FFC928]/35 to-transparent blur-[1px]" />

        <div className="relative z-10 grid h-full grid-cols-[1fr_350px] items-center gap-6 px-9 py-8">
          <div>
            <p className="text-2xl font-bold leading-none text-white">
              Welcome to
            </p>

            <h1 className="mt-2 text-4xl font-black leading-none text-white">
              <span className="text-[#FFC928]">Richlance</span> DEX
            </h1>

            <p className="mt-4 max-w-sm text-base leading-6 text-[#B7BBC6]">
              Trade, Stake, Earn and Grow
              <br />
              All in One Secure Platform.
            </p>

            <Link
              href="/exchange"
              className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#FFC928] px-8 py-3.5 text-sm font-bold text-[#05070B] shadow-[0_12px_30px_rgba(255,201,40,0.18)]"
            >
              Explore Now
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="relative flex h-full items-center justify-center">
            <div className="relative h-44 w-44">
              <Image
                src={desktopRicLogo}
                alt="Richlance coin"
                fill
                sizes="176px"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile slider */}
      <section className="relative aspect-[2.18/1] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E14] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:hidden">
        <Link
          href="/exchange"
          aria-label="Explore Richlance DEX"
          className="absolute inset-0"
        >
          {slides.map((slide, index) => (
            <Image
              key={slide}
              src={slide}
              alt={`Richlance DEX slide ${index + 1}`}
              fill
              priority={index === 0}
              sizes="100vw"
              className={[
                "object-cover object-center transition-opacity duration-700",
                activeSlide === index ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />
          ))}
        </Link>

        <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveSlide(index)}
              className={[
                "h-2 rounded-full transition-all",
                activeSlide === index ? "w-6 bg-[#FFC928]" : "w-4 bg-white/35",
              ].join(" ")}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
      </section>
    </>
  );
}