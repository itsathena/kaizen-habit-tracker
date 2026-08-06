function getStreak(history) {
    let s = 0; const t = new Date();
    for(let i=0; i<365; i++) {
        const d = new Date(); d.setDate(t.getDate()-i);
        const k = d.toISOString().split('T')[0];
        if(history[k]) s++;
        else if(i===0) continue; 
        else break;
    }
    return s;
}

function exportData() {
    const a = document.createElement('a');
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(habits));
    a.download = "kaizen_habits.json"; a.click();
}

function importData(input) {
    const f = input.files[0]; if(!f)return;
    const r = new FileReader(); r.onload = e => { try { habits = JSON.parse(e.target.result); saveData(); alert('Restored.'); } catch(err){ alert('Error'); } };
    r.readAsText(f);
}
