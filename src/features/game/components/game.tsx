"use client";

import { useEffect, useRef } from "react";

export const Game = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function start() {
      const { default: kaplay } = await import("kaplay");
      if (cancelled) return;

      const canvas = document.createElement("canvas");
      container!.appendChild(canvas);

      const k = kaplay({
        canvas,
        global: false,
        width: 800,
        height: 450,
        background: [25, 25, 35],
      });

      cleanup = () => {
        k.quit();
        canvas.remove();
      };

      canvas.style.width = "100%";
      canvas.style.height = "auto";
      canvas.style.display = "block";

      k.setGravity(2000);

      k.add([
        k.rect(800, 50),
        k.pos(0, 400),
        k.area(),
        k.body({ isStatic: true }),
        k.color(90, 160, 100),
      ]);

      const player = k.add([
        k.rect(32, 48),
        k.pos(100, 300),
        k.area(),
        k.body(),
        k.color(100, 190, 255),
      ]);

      k.onKeyDown("left", () => player.move(-250, 0));
      k.onKeyDown("right", () => player.move(250, 0));

      k.onKeyPress("space", () => {
        if (player.isGrounded()) {
          player.jump(650);
        }
      });

      player.onUpdate(() => {
        player.pos.x = k.clamp(player.pos.x, 0, 768);
      });
    }

    void start().catch(console.error);

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%" }} />;
};
