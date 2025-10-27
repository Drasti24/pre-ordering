const API_BASE = 'https://script.google.com/macros/s/AKfycbzCtwJQOc_XgAXr9NPZo3oTXGuJxYDby31ktfWWC2uNuViEa44Ota-KalJo8fJTLKIToA/exec';
const params = new URLSearchParams(location.search);
const slug = params.get('event');

let items = [];
let currency = 'CAD';

function currencyFmt(n) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
}

async function fetchJSON(url) {
    const r = await fetch(url);
    return r.json();
}

function renderItems() {
    const root = document.getElementById('items');
    root.innerHTML = items.map(it => {
        return `
      <div class="itemRow">
        <div>
          <div class="itemName">${it.item_name}</div>
          <div class="itemPrice">${currencyFmt(it.price)} • <span class="badge">${it.remaining} left</span></div>
        </div>
        <input class="qty" type="number" min="0" max="${it.remaining}" step="1" value="0" data-id="${it.item_id}">
      </div>
    `;
    }).join('');
    updateSubtotal();
    root.querySelectorAll('.qty').forEach(inp => inp.addEventListener('input', updateSubtotal));
}

function updateSubtotal() {
    let sum = 0;
    document.querySelectorAll('.qty').forEach(inp => {
        const id = inp.dataset.id;
        const qty = Number(inp.value || 0);
        const it = items.find(x => x.item_id === id);
        if (it) sum += it.price * Math.max(0, Math.min(qty, it.remaining));
    });
    document.getElementById('subtotal').textContent = currencyFmt(sum);
}

async function load() {
    const data = await fetchJSON(`${API_BASE}?action=getEvent&event=${encodeURIComponent(slug)}`);
    const title = document.getElementById('eventTitle');
    const slotSel = document.getElementById('slotSelect');
    const msg = document.getElementById('msg');

    if (!data.ok) {
        title.textContent = 'Event unavailable';
        msg.textContent = data.error || 'Please try again later.';
        return;
    }

    currency = data.event.currency || 'CAD';
    title.textContent = data.event.name;
    items = data.items || [];
    renderItems();

    slotSel.innerHTML = (data.slots || []).map(s => {
        return `<option value="${s.slot_time}">${s.slot_time} (left: ${s.remaining})</option>`;
    }).join('');
}

async function submitOrder(ev) {
    ev.preventDefault();
    const form = ev.target;
    const msg = document.getElementById('msg');

    const itemsPayload = [];
    document.querySelectorAll('.qty').forEach(inp => {
        const qty = Number(inp.value || 0);
        if (qty > 0) {
            itemsPayload.push({ item_id: inp.dataset.id, qty });
        }
    });

    if (itemsPayload.length === 0) {
        msg.textContent = 'Please add at least one item.';
        return;
    }

    const payload = {
        event: slug,
        buyer_name: form.buyer_name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        slot_time: form.slot_time.value,
        items: itemsPayload,
        notes: ''
    };

    const r = await fetch(API_BASE, {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    const out = await r.json();
    if (!out.ok) {
        msg.textContent = out.error || 'Order failed. Try again.';
        return;
    }

    msg.textContent = `✅ Order confirmed! #${out.order_id} — ${currencyFmt(out.subtotal)}.`;
    form.reset();
    load(); // Refresh form with updated stock and slots
}

document.getElementById('orderForm').addEventListener('submit', submitOrder);
load();
