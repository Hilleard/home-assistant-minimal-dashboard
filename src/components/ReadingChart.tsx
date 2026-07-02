import { mdiStar, mdiStarOutline } from "@mdi/js";
import { Icon } from "./Icon";
import type { ReadingChartState } from "../ha/useKidsCharts";

export function ReadingChart({ chart }: { chart: ReadingChartState }) {
  // The most recent filled star (if added today) is the only one that can
  // be tapped, and only to undo it.
  let lastFilledRow = -1;
  let lastFilledCol = -1;
  chart.grid.forEach((row, r) =>
    row.forEach((filled, c) => {
      if (filled) {
        lastFilledRow = r;
        lastFilledCol = c;
      }
    }),
  );

  return (
    <div className="kids-panel">
      <div className="kids-panel-title-container">
        <div className="kids-panel-title">Reading</div>

        <div className="kids-countdown-line">
          {chart.justCompletedRow ? (
            "Reward!"
          ) : (
            <>
              <span className="kids-countdown-line-number">{chart.spotsLeftInRow}</span> Days to go
            </>
          )}
        </div>
      </div>

      <div className="kids-star-grid">
        {chart.grid.map((row, r) => (
          <div className="kids-star-grid-row" key={r}>
            {row.map((filled, c) => {
              const icon = (
                <Icon
                  path={filled ? mdiStar : mdiStarOutline}
                  size="56px"
                  className={`kids-star${filled ? " kids-star--filled" : ""}`}
                />
              );
              if (r === lastFilledRow && c === lastFilledCol && chart.starredToday) {
                return (
                  <button
                    key={c}
                    className="kids-star-undo"
                    onClick={chart.removeStar}
                    aria-label="Remove today's star"
                  >
                    {icon}
                  </button>
                );
              }
              return <span key={c}>{icon}</span>;
            })}
          </div>
        ))}
      </div>

      <button className="kids-cta-button" disabled={chart.starredToday} onClick={chart.addStar}>
        Read Today!
      </button>
    </div>
  );
}
