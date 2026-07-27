import { MissionControl } from "@/components/dashboard/MissionControl";

// Server component: composition only. The interactive mock workflow engine
// lives in the MissionControl client component.
// NC-5 TEMPORARY: fails static prerendering of "/" during next build.
// The condition is opaque to the compiler, so there is no unreachable code and
// the MissionControl import stays used -- this passes tsc and eslint and is
// imported by no test, so it reaches the build step rather than failing earlier.
export default function Home() {
  if (process.env.NEXT_RUNTIME !== "__nc5_never_matches__") {
    throw new Error("NC-5 deliberate prerender failure");
  }
  return <MissionControl />;
}
