function addHabit(name, desc, freq) {
    const id = Date.now().toString();
    habits.push({ id, name, desc, freq, created: new Date().toISOString(), history: {}, notes: {} });
    habitViews[id] = 'heatmap';
    const now = new Date();
    calendarStates[id] = { year: now.getFullYear(), month: now.getMonth() };
    saveData();
}

function updateHabit(id, name, desc, freq) {
    const h = habits.find(x => x.id === id);
    if(h) { h.name = name; h.desc = desc; h.freq = freq; saveData(); }
}

function toggleDate(habitId, dateStr) {
    const h = habits.find(x => x.id === habitId);
    if(h) { 
        h.history[dateStr] ? delete h.history[dateStr] : h.history[dateStr] = true; 
        saveData(true); 
    }
}

function toggleView(habitId) {
    habitViews[habitId] = habitViews[habitId] === 'heatmap' ? 'calendar' : 'heatmap';
    renderHabits(false);
}

function changeMonth(habitId, offset) {
    const state = calendarStates[habitId];
    state.month += offset;
    if (state.month > 11) { state.month = 0; state.year++; }
    if (state.month < 0) { state.month = 11; state.year--; }
    renderHabits(false);
}
