function openModal() { 
    editingId = null; 
    if(inputs.name) inputs.name.value = ''; 
    if(inputs.desc) inputs.desc.value = ''; 
    if(resetBtn) resetBtn.style.display = 'none'; 
    document.getElementById('modalTitle').innerText = 'Design Routine';
    if(modal) { modal.style.display = 'flex'; if(inputs.name) inputs.name.focus(); }
}

function openEdit(id) { 
    const h = habits.find(x => x.id === id); 
    if(h){ 
        editingId = id; 
        if(inputs.name) inputs.name.value = h.name; 
        if(inputs.desc) inputs.desc.value = h.desc; 
        if(inputs.freq) inputs.freq.value = h.freq; 
        if(resetBtn) resetBtn.style.display = 'block'; 
        document.getElementById('modalTitle').innerText = 'Refine Routine';
        if(modal) modal.style.display = 'flex'; 
    } 
}

function closeModal() { if(modal) modal.style.display = 'none'; }

function saveHabit() { 
    if (!inputs.name) return; 
    const name = inputs.name.value.trim();
    if(!name) return alert('Name required'); 
    
    if(editingId) updateHabit(editingId, name, inputs.desc.value, inputs.freq.value); 
    else addHabit(name, inputs.desc.value, inputs.freq.value); 
    closeModal(); 
}

// --- DAY DETAILS (Notes & Double Click) ---

function attachGridEvents(element, habitId, dateStr) {
    let pressTimer;
    let isLongPress = false;

    element.addEventListener('click', (e) => {
        if (isLongPress) {
            isLongPress = false;
            return;
        }
        toggleDate(habitId, dateStr);
    });

    element.addEventListener('dblclick', (e) => {
        openDayModal(habitId, dateStr);
    });

    element.addEventListener('touchstart', (e) => {
        isLongPress = false;
        pressTimer = setTimeout(() => {
            isLongPress = true;
            if (navigator.vibrate) navigator.vibrate(50); 
            openDayModal(habitId, dateStr);
        }, 500); 
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
        clearTimeout(pressTimer);
    });
    
    element.addEventListener('touchmove', (e) => {
        clearTimeout(pressTimer); 
    });
}

function openDayModal(habitId, dateStr) {
    const h = habits.find(x => x.id === habitId);
    if (!h) return;

    currentDayHabitId = habitId;
    currentDayDateStr = dateStr;
    
    const dateObj = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dayModalTitle').innerText = dateObj.toLocaleDateString(undefined, options);
    document.getElementById('dayModalSubtitle').innerText = h.name;

    currentDayStatus = !!h.history[dateStr];
    updateDayStatusUI();

    if (!h.notes) h.notes = {};
    dayNoteInput.value = h.notes[dateStr] || '';

    dayModal.style.display = 'flex';
}

function toggleDayStatus() {
    currentDayStatus = !currentDayStatus;
    updateDayStatusUI();
}

function updateDayStatusUI() {
    if (currentDayStatus) {
        dayStatusBtn.classList.add('active');
        dayStatusBtn.innerText = "Completed";
    } else {
        dayStatusBtn.classList.remove('active');
        dayStatusBtn.innerText = "Mark as Done";
    }
}

function saveDayDetails() {
    const h = habits.find(x => x.id === currentDayHabitId);
    if (h) {
        if (currentDayStatus) h.history[currentDayDateStr] = true;
        else delete h.history[currentDayDateStr];

        const note = dayNoteInput.value.trim();
        if(!h.notes) h.notes = {};
        if (note) h.notes[currentDayDateStr] = note;
        else delete h.notes[currentDayDateStr];

        saveData(true);
    }
    closeDayModal();
}

function closeDayModal() {
    dayModal.style.display = 'none';
    currentDayHabitId = null;
    currentDayDateStr = null;
}

// --- GLOBAL CLICKS ---
window.onclick = e => { 
    if(modal && e.target == modal) closeModal(); 
    if(deleteModal && e.target == deleteModal) closeDeleteModal();
    if(resetModal && e.target == resetModal) closeResetModal();
    if(dayModal && e.target == dayModal) closeDayModal();
};

function deleteHabit(id) { deletingId = id; if(deleteModal) deleteModal.style.display = 'flex'; }

function closeDeleteModal() { if(deleteModal) deleteModal.style.display = 'none'; deletingId = null; }

function confirmDelete() {
    if (deletingId) { habits = habits.filter(h => h.id !== deletingId); saveData(); closeDeleteModal(); }
}

function openResetModal() { if(resetModal) resetModal.style.display = 'flex'; }

function closeResetModal() { if(resetModal) resetModal.style.display = 'none'; }

function confirmReset() {
     if (!editingId) return;
     const h = habits.find(x => x.id === editingId);
     if (h) { h.history = {}; h.notes = {}; saveData(); }
     closeResetModal(); closeModal(); 
}

// --- GLOBAL CLICKS ---
window.onclick = e => { 
    if(modal && e.target == modal) closeModal(); 
    if(deleteModal && e.target == deleteModal) closeDeleteModal();
    if(resetModal && e.target == resetModal) closeResetModal();
    if(dayModal && e.target == dayModal) closeDayModal();
    
    // HIDE TOOLTIP ON MOBILE WHEN TAPPING OUTSIDE A BLOCK
    if(tooltip && !e.target.classList.contains('day-box')) {
        tooltip.style.display = 'none';
    }
};

// HIDE TOOLTIP ON SCROLLING (When you move your hand away)
window.addEventListener('touchmove', () => {
    if (tooltip && tooltip.style.display === 'block') {
        tooltip.style.display = 'none';
    }
}, { passive: true });