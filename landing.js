const API_BASE = 'https://script.google.com/macros/s/AKfycbzCtwJQOc_XgAXr9NPZo3oTXGuJxYDby31ktfWWC2uNuViEa44Ota-KalJo8fJTLKIToA/exec';


async function fetchJSON(url) {
    const r = await fetch(url);
    return r.json();
}


async function load() {
    const root = document.getElementById('events');
    const data = await fetchJSON(`${API_BASE}?action=listEvents`);
    if (!data.ok) {
        root.innerHTML = `<p>Unable to load events: ${data.error || 'Unknown error'}</p>`;
        return;
    }
    if (data.events.length === 0) {
        root.innerHTML = '<p>No active events right now. Please check back soon.</p>';
        return;
    }
    root.innerHTML = data.events.map(ev => `
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