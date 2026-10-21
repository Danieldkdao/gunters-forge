import { Game } from "@/features/game/components/game";

const PlayPage = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-3xl font-semibold">
          Gunter&apos;s Mining Adventure
        </h1>
        <p className="text-lg text-muted-foreground">
          Jump over rocks, protect your three lives, and see how far Gunter can run.
        </p>
      </div>
      <div className="w-full min-w-0">
        <Game />
      </div>
    </div>
  );
};

export default PlayPage;
