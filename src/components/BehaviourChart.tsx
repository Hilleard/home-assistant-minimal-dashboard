import { mdiCheckCircle, mdiCheckCircleOutline } from "@mdi/js";
import { Icon } from "./Icon";
import type { BehaviourChartState } from "../ha/useKidsCharts";

export function BehaviourChart({ chart }: { chart: BehaviourChartState }) {
  const spotsLeft = chart.nextMilestone - chart.days;
  const allDoneToday = chart.categories.every((c) => c.markedToday);
  const justHitMilestone = allDoneToday && chart.days > 0 && chart.days % 10 === 0;

  return (
    <div className="kids-panel">
      <div className="kids-panel-title-container">
        <div className="kids-panel-title">Behaviour</div>

        <div className="kids-countdown-line">
          {justHitMilestone ? (
            "Amazing!"
          ) : (
            <>
              <span className="kids-countdown-line-number">{spotsLeft}</span> Days to go
            </>
          )}
        </div>
      </div>

      <div className="kids-behaviour-list">
        {chart.categories.map((c) => (
          <button
            key={c.slug}
            className={`kids-behaviour-item${c.markedToday ? " kids-behaviour-item--done" : ""}`}
            onClick={() => chart.toggleCategory(c.slug)}
          >
            <Icon path={c.markedToday ? mdiCheckCircle : mdiCheckCircleOutline} size="48px" />
            <span>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
