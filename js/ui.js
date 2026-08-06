function showAppView() {
    if(landingView) landingView.style.display = 'none';
    if(appView) {
        appView.style.display = 'block';
        appView.classList.add('fade-in');
    }
}

function showLandingView() {
    if(appView) appView.style.display = 'none';
    if(landingView) {
        landingView.style.display = 'flex';
        landingView.classList.add('fade-in');
    }
}

function enterGuestMode() {
    const localData = JSON.parse(localStorage.getItem('kaizenHabits'));
    habits = localData || [];
    initViews();
    renderHabits(true);
    showAppView();
}

function initViews() {
    habits.forEach(h => {
        if(!habitViews[h.id]) habitViews[h.id] = 'heatmap';
        if(!calendarStates[h.id]) {
            const now = new Date();
            calendarStates[h.id] = { year: now.getFullYear(), month: now.getMonth() };
        }
        if(!h.notes) h.notes = {};
    });
}

// --- AUTH & SYNC ---

function renderHabits(forceScrollToEnd = false) {
    const pageScrollY = window.scrollY;
    const scrollPositions = {};
    
    habits.forEach(h => {
        const el = document.getElementById(`scroll-wrapper-${h.id}`);
        if(el && el.offsetParent !== null) {
            scrollPositions[h.id] = el.scrollLeft;
        }
    });

    const list = document.getElementById('habitList');
    if(list) {
        list.innerHTML = '';
        
        if(habits.length === 0) { 
            list.innerHTML = `
                <div style="text-align:center; padding:80px; color:var(--ink-light); font-weight:300;">
                    ${currentUser ? 'Your cloud journey begins here.' : 'No habits yet.'}
                </div>`; 
            return; 
        }

        habits.forEach(h => {
            if(!habitViews[h.id]) habitViews[h.id] = 'heatmap';
            if(!calendarStates[h.id]) { const n = new Date(); calendarStates[h.id] = { year: n.getFullYear(), month: n.getMonth() }; }

            const streak = getStreak(h.history);
            const count = Object.keys(h.history).length;
            const isCalendar = habitViews[h.id] === 'calendar';
            
            const card = document.createElement('div');
            card.className = 'habit-card';
            card.innerHTML = `
                <div class="habit-header">
                    <div class="habit-title">
                        <h2>${h.name}</h2>
                        <div class="habit-desc">${h.desc}</div>
                    </div>
                    <div class="action-icons">
                        <span class="action-icon" onclick="toggleView('${h.id}')" title="${isCalendar ? 'View Heatmap' : 'View Calendar'}">
                            ${isCalendar ? iconGrid : iconCalendar}
                        </span>
                        <span class="action-icon" onclick="openEdit('${h.id}')" title="Edit">✎</span>
                        <span class="action-icon" onclick="deleteHabit('${h.id}')" title="Delete">✕</span>
                    </div>
                </div>
                <div class="stats-bar">
                    <div class="stat"><span class="stat-label">Streak</span><span class="stat-val">${streak}</span></div>
                    <div class="stat"><span class="stat-label">Total</span><span class="stat-val">${count}</span></div>
                </div>
                
                <div id="heatmap-view-${h.id}" class="heatmap-container ${isCalendar ? 'hidden' : ''}">
                    <div class="day-labels">
                        <div class="day-label">Mon</div><div class="day-label">Tue</div><div class="day-label">Wed</div>
                        <div class="day-label">Thu</div><div class="day-label">Fri</div><div class="day-label">Sat</div><div class="day-label">Sun</div>
                    </div>
                    <div class="heatmap-scroll-wrapper" id="scroll-wrapper-${h.id}">
                        <div class="months-row" id="months-${h.id}"></div>
                        <div class="heatmap-grid" id="grid-${h.id}"></div>
                    </div>
                </div>

                <div id="calendar-view-${h.id}" class="calendar-container ${isCalendar ? 'active' : ''}">
                </div>
            `;
            list.appendChild(card);
            
            if (!isCalendar) {
                renderHeatmap(h.id, h.history, h.notes); 
                const wrapper = document.getElementById(`scroll-wrapper-${h.id}`);
                if(wrapper) {
                    if (forceScrollToEnd) {
                        setTimeout(() => wrapper.scrollLeft = wrapper.scrollWidth, 0);
                    } else if (scrollPositions[h.id] !== undefined) {
                        wrapper.scrollLeft = scrollPositions[h.id];
                    } else {
                         setTimeout(() => wrapper.scrollLeft = wrapper.scrollWidth, 0);
                    }
                }
            } else {
                renderCalendar(h.id, h.history, h.notes);
            }
        });
        
        window.scrollTo(0, pageScrollY);
    }
}
