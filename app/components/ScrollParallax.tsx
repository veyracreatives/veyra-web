"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollParallaxProps {
  children: ReactNode;
  /** Speed multiplier. 0 = static, 0.5 = half scroll speed, 1 = full speed (default 0.3) */
  speed?: number;
  /** Direction of parallax movement */
  direction?: "up" | "down";
  /** Additional className */
  className?: string;
}

export default function ScrollParallax({
  children,
  speed = 0.3,
  direction = "up",
  className = "",
}: ScrollParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const windowH = window.innerHeight;
            // How far the element center is from the viewport center, normalised
            const progress = (rect.top + rect.height / 2 - windowH / 2) / windowH;
            const sign = direction === "up" ? -1 : 1;
            setOffset(progress * speed * 200 * sign);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial position
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed, direction]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translateY(${offset}px)`,
        willChange: "transform",
        transition: "transform 0.1s linear",
      }}
    >
      {children}
    </div>
  );
}
