import type { HassEntities } from "home-assistant-js-websocket";
import { useReadingChart, useBehaviourChart } from "../ha/useKidsCharts";
import { ReadingChart } from "./ReadingChart";
import { BehaviourChart } from "./BehaviourChart";

export function KidsPage({ entities }: { entities: HassEntities }) {
  const reading = useReadingChart(entities);
  const behaviour = useBehaviourChart(entities);

  return (
    <div className="kids-page">
      <BehaviourChart chart={behaviour} />
      <ReadingChart chart={reading} />
    </div>
  );
}
