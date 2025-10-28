async function fetchJSON(refPath) {
    const snap = await db.ref(refPath).get();
    return snap.val();
}

async function load() {
    const root = document.getElementById('events');
    const data = await fetchJSON('events');
    if (!data) {
        root.innerHTML = `<p>Unable to load events</p>`;
        return;
    }

    const events = Object.values(data).filter(ev => ev.active);
    if (events.length === 0) {
        root.innerHTML = '<p>No active events right now. Please check back soon.</p>';
        return;
    }

    root.innerHTML = events.map(ev => `
        <a class="eventCard" href="event.html?event=${encodeURIComponent(ev.slug)}">
            <div class="card">
                ${ev.banner_image ? `<img src="${ev.banner_image}" alt="${ev.name}">` : ''}
                <h3>${ev.name}</h3>
                <div class="badge">${ev.currency || 'CAD'}</div>
            </div>
        </a>
    `).join('');
}

load();
