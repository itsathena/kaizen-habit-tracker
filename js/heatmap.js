function renderHeatmap(habitId, history, notes = {}) {
  const grid = document.getElementById(`grid-${habitId}`);
  const monthsContainer = document.getElementById(`months-${habitId}`);
  if (!grid || !monthsContainer) return;

  // Reset content to prevent duplicates if called multiple times (though currently we wipe the whole list)
  grid.innerHTML = "";
  monthsContainer.innerHTML = "";

  const boxSize = 15;
  const boxGap = 4;
  const columnWidth = boxSize + boxGap;
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 364);
  const day = startDate.getDay();
  const diff = startDate.getDate() - day + (day == 0 ? -6 : 1);
  startDate.setDate(diff);
  const daysToRender = 53 * 7;
  let currentMonth = -1;

  for (let i = 0; i < daysToRender; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const isDone = history[dateStr];
    const hasNote = notes[dateStr];
    const isToday = dateStr === today.toISOString().split("T")[0];
    const readableDate = d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const box = document.createElement("div");
    box.className = `day-box ${isDone ? "l-done" : ""} ${isToday ? "l-today" : ""}`;

    if (hasNote && !isDone) box.style.border = "1px solid var(--ink-light)";

    attachGridEvents(box, habitId, dateStr);

    box.onmousemove = (e) => {
      if (!tooltip) return;

      const noteText = hasNote
        ? `<br><span style="font-size:0.7em; opacity:0.8">
        ${hasNote.substring(0, 20)}${hasNote.length > 20 ? "..." : ""}
      </span>`
        : "";

      tooltip.innerHTML = `${readableDate}${noteText}`;
      tooltip.style.display = "block";

      tooltip.style.left = `${e.clientX}px`;
      tooltip.style.top = `${e.clientY - 12}px`;

      tooltip.style.setProperty(
        "transform",
        "translate(-50%, -100%)",
        "important",
      );
    };
    box.onmouseleave = () => {
      if (tooltip) tooltip.style.display = "none";
    };

    if (d > today) {
      box.style.opacity = "0.3";
      box.style.pointerEvents = "none";
    }
    grid.appendChild(box);

    if (i % 7 === 0) {
      if (d.getMonth() !== currentMonth && d.getDate() < 14) {
        currentMonth = d.getMonth();
        const colIndex = Math.floor(i / 7);
        const label = document.createElement("div");
        label.className = "month-label";
        label.innerText = d.toLocaleDateString(undefined, { month: "short" });
        label.style.left = `${colIndex * columnWidth}px`;
        monthsContainer.appendChild(label);
      }
    }
  }
}
