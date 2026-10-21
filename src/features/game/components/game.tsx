"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type GameStatus = "loading" | "ready" | "running" | "gameover" | "error";

export const Game = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<{ jump: () => void } | null>(null);
  const [runId, setRunId] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<GameStatus>("loading");

  const restart = useCallback(() => {
    setLives(3);
    setScore(0);
    setStatus("loading");
    setRunId((current) => current + 1);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function start() {
      const { default: kaplay } = await import("kaplay");
      if (cancelled) return;

      const canvas = document.createElement("canvas");
      canvas.tabIndex = 0;
      canvas.setAttribute("aria-label", "Mining runner. Press Space or Up to jump.");
      container!.appendChild(canvas);

      const preventScroll = (event: KeyboardEvent) => {
        if (event.code === "Space" || event.code === "ArrowUp") {
          event.preventDefault();
        }
      };
      canvas.addEventListener("keydown", preventScroll);

      const k = kaplay({
        canvas,
        global: false,
        width: 800,
        height: 450,
        background: [25, 25, 35],
      });

      cleanup = () => {
        controlsRef.current = null;
        canvas.removeEventListener("keydown", preventScroll);
        k.quit();
        canvas.remove();
      };

      canvas.style.width = "100%";
      canvas.style.height = "auto";
      canvas.style.display = "block";
      canvas.style.imageRendering = "pixelated";

      k.onLoadError(() => {
        if (!cancelled) setStatus("error");
      });
      k.onError((error) => {
        console.error(error);
        if (!cancelled) setStatus("error");
      });

      k.loadSprite("mining", "/sprites/gunter-mining-sheet.png", {
        sliceX: 4,
        sliceY: 4,
        anims: {
          idle: { from: 0, to: 3, speed: 6, loop: true },
          walk: { from: 4, to: 7, speed: 8, loop: true },
          jump: { from: 8, to: 11, speed: 10, loop: false },
        },
      });

      k.loadSpriteAtlas("/sprites/gunter-mining-sheet.png", {
        rock: { x: 11, y: 207, width: 46, height: 36 },
      });

      k.onLoad(() => {
        if (cancelled) return;

        k.setGravity(2000);

        const floorY = k.height() - 40;
        const startX = 150;
        const chunkWidth = 1000;
        const runSpeed = 320;
        let phase: "ready" | "running" | "gameover" = "ready";
        let remainingLives = 3;
        let invulnerableUntil = 0;
        let furthestX = startX;
        let displayedScore = 0;
        let nextChunkX = 0;

        const player = k.add([
          k.sprite("mining", { anim: "idle" }),
          k.pos(startX, floorY - 6),
          k.anchor("bot"),
          k.scale(2),
          k.opacity(1),
          k.area({ shape: new k.Rect(k.vec2(0, -3), 30, 44) }),
          k.body(),
        ]);

        const spawnRock = (x: number) =>
          k.add([
            k.sprite("rock"),
            k.pos(x, floorY),
            k.anchor("bot"),
            k.scale(2),
            k.area({ shape: new k.Rect(k.vec2(0, 0), 34, 30) }),
            k.body({ isStatic: true }),
            "rock",
          ]);

        const chunks: { endX: number; remove: () => void }[] = [];

        const generateChunk = (start: number) => {
          const floor = k.add([
            k.rect(chunkWidth, 40),
            k.pos(start, floorY),
            k.color(85, 65, 45),
            k.area(),
            k.body({ isStatic: true }),
          ]);
          const rocks = [
            spawnRock(start + k.rand(420, 500)),
            spawnRock(start + k.rand(800, 880)),
          ];

          chunks.push({
            endX: start + chunkWidth,
            remove: () => {
              k.destroy(floor);
              for (const rock of rocks) {
                if (rock.exists()) k.destroy(rock);
              }
            },
          });
        };

        const extendWorld = () => {
          while (nextChunkX < furthestX + k.width() * 2) {
            generateChunk(nextChunkX);
            nextChunkX += chunkWidth;
          }
        };

        extendWorld();

        const updateScore = () => {
          furthestX = Math.max(furthestX, player.pos.x);
          const distance = Math.floor((furthestX - startX) / 10);
          if (distance !== displayedScore) {
            displayedScore = distance;
            setScore(distance);
          }
        };

        const endRun = () => {
          updateScore();
          phase = "gameover";
          player.vel = k.vec2(0, 0);
          player.opacity = 1;
          player.stop();
          k.setGravity(0);
          setStatus("gameover");
        };

        const jump = () => {
          canvas.focus({ preventScroll: true });
          if (phase === "ready") {
            phase = "running";
            setStatus("running");
          } else if (phase === "running" && player.isGrounded()) {
            player.jump(800);
            player.play("jump");
          }
        };

        controlsRef.current = { jump };
        setStatus("ready");

        k.onKeyPress(["space", "up"], () => {
          if (document.activeElement === canvas) jump();
        });
        k.onKeyPress("r", () => {
          if (phase === "gameover" && document.activeElement === canvas) restart();
        });

        player.onCollide("rock", (rock) => {
          if (phase !== "running") return;
          k.destroy(rock);
          if (k.time() < invulnerableUntil) return;

          remainingLives -= 1;
          setLives(remainingLives);

          if (remainingLives === 0) {
            endRun();
          } else {
            invulnerableUntil = k.time() + 1;
          }
        });

        player.onUpdate(() => {
          if (phase !== "running") return;

          player.move(runSpeed, 0);
          player.opacity =
            k.time() < invulnerableUntil && Math.floor(k.time() * 12) % 2 === 0
              ? 0.35
              : 1;

          if (player.isGrounded() && player.getCurAnim()?.name !== "walk") {
            player.play("walk");
          }

          updateScore();
          const cameraX = Math.max(k.width() / 2, furthestX);
          const leftEdge = cameraX - k.width() / 2;
          k.setCamPos(cameraX, k.height() / 2);
          extendWorld();

          while (chunks.length > 0 && chunks[0].endX < leftEdge - chunkWidth) {
            chunks.shift()!.remove();
          }

          if (player.pos.y > k.height() + 100) {
            remainingLives = 0;
            setLives(0);
            endRun();
          }
        });
      });
    }

    void start().catch((error) => {
      console.error(error);
      cleanup?.();
      cleanup = undefined;
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [runId, restart]);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border bg-[#191923]">
        <div className="pointer-events-none relative z-10 flex min-h-20 items-center justify-between gap-4 border-b border-white/10 bg-[#252532] px-4 py-3 text-white sm:px-5">
          <div role="img" aria-label={`${lives} of 3 lives remaining`} className="flex shrink-0 gap-1">
            {[0, 1, 2].map((heart) => (
              <span
                key={heart}
                aria-hidden="true"
                className="block size-10 shrink-0 sm:size-12"
                style={{
                  backgroundImage: "url('/sprites/hearts.png')",
                  backgroundSize: "300% 100%",
                  backgroundPosition: heart < lives ? "0% 0%" : "100% 0%",
                  backgroundRepeat: "no-repeat",
                  imageRendering: "pixelated",
                }}
              />
            ))}
          </div>
          <div className="text-right font-mono tabular-nums">
            <p className="text-xs uppercase tracking-widest text-white/70">Distance</p>
            <p className="text-xl font-bold sm:text-3xl" aria-label={`Distance: ${score} meters`}>
              {score.toString().padStart(5, "0")} m
            </p>
          </div>
        </div>
        <div className="relative">
          <div ref={containerRef} className="aspect-[16/9] w-full" />
          {status !== "running" && (
            <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/55 p-3 text-center text-white">
              <div className="max-w-sm space-y-3 rounded-lg border border-white/15 bg-[#191923]/95 p-4 sm:p-6" role="status">
                <h2 className="text-xl font-semibold sm:text-3xl">
                  {status === "loading"
                    ? "Preparing the mine…"
                    : status === "gameover"
                      ? "Run complete"
                      : status === "error"
                        ? "The game couldn’t load"
                        : "Gunter’s Mining Adventure"}
                </h2>
                <p className="text-sm text-white/80 sm:text-base">
                  {status === "gameover"
                    ? `You travelled ${score} meters. Try to beat your distance!`
                    : status === "error"
                      ? "Try loading the game again."
                      : status === "loading"
                        ? "Loading your next adventure."
                        : "Run automatically. Jump over rocks. Three hits end your run."}
                </p>
                {status !== "loading" && (
                  <button
                    type="button"
                    className="min-h-11 rounded bg-amber-400 px-5 py-2 font-semibold text-stone-950 transition-colors hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    onClick={status === "ready" ? () => controlsRef.current?.jump() : restart}
                  >
                    {status === "ready" ? "Start running" : status === "error" ? "Try again" : "Run again"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Space or ↑ to jump · Avoid rocks · R to restart after a run</p>
        <button
          type="button"
          disabled={status !== "running"}
          className="min-h-11 touch-manipulation rounded-md border bg-background px-6 py-2 font-semibold disabled:opacity-40"
          onPointerDown={(event) => {
            event.preventDefault();
            controlsRef.current?.jump();
          }}
          onClick={(event) => {
            if (event.detail === 0) controlsRef.current?.jump();
          }}
        >
          Jump
        </button>
      </div>
    </div>
  );
};
