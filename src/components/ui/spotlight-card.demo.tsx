import { GlowCard } from "./spotlight-card";

export function Default() {
  return (
    <div className="w-screen h-screen flex flex-row items-center justify-center gap-10 custom-cursor">
      <GlowCard>
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold">Card 1</h2>
          <p className="text-gray-600">This is a demo card with a spotlight effect</p>
        </div>
      </GlowCard>
      <GlowCard glowColor="purple">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold">Card 2</h2>
          <p className="text-gray-600">Purple spotlight variant</p>
        </div>
      </GlowCard>
      <GlowCard glowColor="green" size="lg">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold">Card 3</h2>
          <p className="text-gray-600">Large green spotlight variant</p>
        </div>
      </GlowCard>
    </div>
  );
}
