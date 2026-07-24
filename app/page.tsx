import { MissionControl } from "@/components/dashboard/MissionControl";

// Server component: composition only. The interactive mock workflow engine
// lives in the MissionControl client component.
export default function Home() {
  return <MissionControl />;
}
