function showAppView() {
  if (landingView) landingView.style.display = "none";
  if (appView) {
    appView.style.display = "block";
    appView.classList.add("fade-in");
  }
}

function showLandingView() {
  if (appView) appView.style.display = "none";
  if (landingView) {
    landingView.style.display = "flex";
    landingView.classList.add("fade-in");
  }
}

function toggleCollapse(habitId) {
  // Flip the boolean state for the specific habit
  habitCollapsed[habitId] = !habitCollapsed[habitId];
  // Re-render the UI without forcing scroll
  renderHabits(false);
}

function enterGuestMode() {
  const localData = JSON.parse(localStorage.getItem("kaizenHabits"));
  habits = localData || [];
  initViews();
  renderHabits(true);
  showAppView();
}

function initViews() {
  habits.forEach((h) => {
    if (!habitViews[h.id]) habitViews[h.id] = "heatmap";
    if (!calendarStates[h.id]) {
      const now = new Date();
      calendarStates[h.id] = { year: now.getFullYear(), month: now.getMonth() };
    }
    if (!h.notes) h.notes = {};
  });
}

// --- AUTH & SYNC ---

function renderHabits(forceScrollToEnd = false) {
  const pageScrollY = window.scrollY;
  const scrollPositions = {};

  habits.forEach((h) => {
    const el = document.getElementById(`scroll-wrapper-${h.id}`);
    if (el && el.offsetParent !== null) {
      scrollPositions[h.id] = el.scrollLeft;
    }
  });

  const list = document.getElementById("habitList");
  if (list) {
    list.innerHTML = "";

    if (habits.length === 0) {
      list.innerHTML = `
                <div style="text-align:center; padding:80px; color:var(--ink-light); font-weight:300;">
                    ${currentUser ? "Your cloud journey begins here." : "No habits yet."}
                </div>`;
      return;
    }

    habits.forEach((h, index) => {
      if (!habitViews[h.id]) habitViews[h.id] = "heatmap";
      if (!calendarStates[h.id]) {
        const n = new Date();
        calendarStates[h.id] = { year: n.getFullYear(), month: n.getMonth() };
      }

      const streak = getStreak(h.history);
      const count = Object.keys(h.history).length;
      const isCalendar = habitViews[h.id] === "calendar";
      const isCollapsed = habitCollapsed[h.id]; // Check if this habit is collapsed

      const card = document.createElement("div");
      card.className = `habit-card ${isCollapsed ? "collapsed" : ""}`;

      // DRAG AND DROP ATTRIBUTES
      card.draggable = true;
      card.dataset.id = h.id;

      // DRAG AND DROP EVENTS
      // DRAG AND DROP EVENTS
      card.ondragstart = (e) => {
        draggedItemId = h.id;
        draggedItemIndex = index;
        e.target.style.opacity = "0.4";
        // Required for Firefox
        if (e.dataTransfer) e.dataTransfer.setData("text/plain", h.id);
      };
      card.ondragend = (e) => {
        e.target.style.opacity = "1";
        document
          .querySelectorAll(".habit-card")
          .forEach((c) => (c.style.borderTop = ""));
      };
      card.ondragenter = (e) => {
        e.preventDefault();
        if (draggedItemId && draggedItemId !== h.id) {
          card.style.borderTop = "3px solid var(--ink-black)"; // Fixed color variable
        }
      };
      card.ondragover = (e) => {
        e.preventDefault(); // Necessary to allow dropping
      };
      card.ondragleave = (e) => {
        // Only remove the border if the mouse/finger actually left the card (not just hovering over text inside it)
        if (!card.contains(e.relatedTarget)) {
          card.style.borderTop = "";
        }
      };
      card.ondrop = (e) => {
        e.preventDefault();
        card.style.borderTop = "";
        if (draggedItemId && draggedItemId !== h.id) {
          // Reorder the array
          const itemToMove = habits.splice(draggedItemIndex, 1)[0];
          habits.splice(index, 0, itemToMove);
          saveData(true); // Save new order
        }
      };

      card.innerHTML = `
                <div class="habit-header">
                    <div class="habit-title" style="display: flex; align-items: center;">
                        <span class="drag-handle" title="Drag to reorder" style="cursor: grab; margin-right: 12px; color: var(--ink-light); font-size: 1.2rem;">⋮⋮</span>
                        <div>
                            <h2>${h.name}</h2>
                            ${!isCollapsed ? `<div class="habit-desc">${h.desc}</div>` : ""}
                        </div>
                    </div>
                    <div class="action-icons">
                        <span class="action-icon" onclick="toggleCollapse('${h.id}')" title="Collapse/Expand">
                            ${isCollapsed ? iconDown : iconUp}
                        </span>
                        <span class="action-icon" onclick="toggleView('${h.id}')" title="${isCalendar ? "View Heatmap" : "View Calendar"}">
                            ${isCalendar ? iconGrid : iconCalendar}
                        </span>
                        <span class="action-icon" onclick="openEdit('${h.id}')" title="Edit">✎</span>
                        <span class="action-icon" onclick="deleteHabit('${h.id}')" title="Delete">✕</span>
                    </div>
                </div>
                
                <div class="habit-body" style="display: ${isCollapsed ? "none" : "block"};">
                    <div class="stats-bar">
                        <div class="stat"><span class="stat-label">Streak</span><span class="stat-val">${streak}</span></div>
                        <div class="stat"><span class="stat-label">Total</span><span class="stat-val">${count}</span></div>
                    </div>
                    
                    <div id="heatmap-view-${h.id}" class="heatmap-container ${isCalendar ? "hidden" : ""}">
                        <div class="day-labels">
                            <div class="day-label">Mon</div><div class="day-label">Tue</div><div class="day-label">Wed</div>
                            <div class="day-label">Thu</div><div class="day-label">Fri</div><div class="day-label">Sat</div><div class="day-label">Sun</div>
                        </div>
                        <div class="heatmap-scroll-wrapper" id="scroll-wrapper-${h.id}">
                            <div class="months-row" id="months-${h.id}"></div>
                            <div class="heatmap-grid" id="grid-${h.id}"></div>
                        </div>
                    </div>

                    <div id="calendar-view-${h.id}" class="calendar-container ${isCalendar ? "active" : ""}">
                    </div>
                </div>
            `;
      list.appendChild(card);

      // Only render charts if the card is NOT collapsed to save resources
      if (!isCollapsed) {
        if (!isCalendar) {
          renderHeatmap(h.id, h.history, h.notes);
          const wrapper = document.getElementById(`scroll-wrapper-${h.id}`);
          if (wrapper) {
            if (forceScrollToEnd) {
              setTimeout(() => (wrapper.scrollLeft = wrapper.scrollWidth), 0);
            } else if (scrollPositions[h.id] !== undefined) {
              wrapper.scrollLeft = scrollPositions[h.id];
            } else {
              setTimeout(() => (wrapper.scrollLeft = wrapper.scrollWidth), 0);
            }
          }
        } else {
          renderCalendar(h.id, h.history, h.notes);
        }
      }
    });

    window.scrollTo(0, pageScrollY);
  }
}

function toggleDashboardLayout() {
  isDashboardGrid = !isDashboardGrid;
  const list = document.getElementById("habitList");
  const btn = document.getElementById("layoutToggleBtn");

  if (isDashboardGrid) {
    list.classList.add("grid-view");
    btn.innerText = "List View";
  } else {
    list.classList.remove("grid-view");
    btn.innerText = "Grid View";
  }

  renderHabits(false);
}

function toggleAllCollapse() {
  isAllCollapsed = !isAllCollapsed; // Flip the global state

  // Apply the new state to every single habit
  habits.forEach((h) => {
    habitCollapsed[h.id] = isAllCollapsed;
  });

  // Update the icon and tooltip instead of text
  const btn = document.getElementById("collapseAllBtn");
  if (btn) {
    btn.innerText = isAllCollapsed ? "▲" : "▼";
    btn.title = isAllCollapsed ? "Expand All" : "Collapse All";
  }

  // Re-render the UI to show the changes
  renderHabits(false);
}
