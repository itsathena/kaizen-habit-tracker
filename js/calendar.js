function renderCalendar(habitId, history, notes = {}) {
    const container = document.getElementById(`calendar-view-${habitId}`);
    if(!container) return; 

    const state = calendarStates[habitId];
    const year = state.year;
    const month = state.month;
    const firstDay = new Date(year, month, 1).getDay(); 
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    const todayStr = new Date().toISOString().split('T')[0];

    // Clear Previous
    container.innerHTML = '';

    // Create Header
    const header = document.createElement('div');
    header.className = 'cal-header';
    header.innerHTML = `
        <button class="btn btn-sm" onclick="changeMonth('${habitId}', -1)">←</button>
        <div class="cal-title">${monthName} ${year}</div>
        <button class="btn btn-sm" onclick="changeMonth('${habitId}', 1)">→</button>
    `;
    container.appendChild(header);

    // Create Grid
    const grid = document.createElement('div');
    grid.className = 'cal-grid';

    // Day Names
    const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    dayNames.forEach(d => {
        const div = document.createElement('div');
        div.className = 'cal-day-name';
        div.innerText = d;
        grid.appendChild(div);
    });

    // Empty Slots
    for(let i=0; i<startOffset; i++) {
        const div = document.createElement('div');
        div.className = 'cal-day empty';
        grid.appendChild(div);
    }

    // Days
    for(let d=1; d<=daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isDone = history[dateStr];
        const isToday = dateStr === todayStr;
        const hasNote = notes[dateStr] ? true : false;

        const dayDiv = document.createElement('div');
        dayDiv.className = `cal-day ${isDone ? 'done' : ''} ${isToday ? 'today' : ''}`;
        dayDiv.innerText = d;
        
        if(hasNote) dayDiv.style.textDecoration = 'underline';
        
        // ATTACH EVENTS (Click / DblClick / LongPress)
        attachGridEvents(dayDiv, habitId, dateStr);
        
        grid.appendChild(dayDiv);
    }
    container.appendChild(grid);
}
