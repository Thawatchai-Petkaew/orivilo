import { designProfileSchema } from "@origo/intent-engine";

const schemaVersion = designProfileSchema.shape.schemaVersion.value;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-4">
      <h1 className="text-3xl font-semibold">ORIGO</h1>
      <p>From business intent to living digital products.</p>
      <p className="text-muted text-sm">
        Foundation scaffold only. No Studio features are built yet. Design Profile schema v
        {schemaVersion}.
      </p>
    </main>
  );
}
