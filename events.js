const slug = new URLSearchParams(location.search).get("event");
const db = firebase.database();
let currency = "CAD";

async function loadEvent() {
    const snap = await db.ref(`events/${slug}`).get();
    const event = snap.val();
    if (!event || !event.active) return alert("Event not found or inactive");

    currency = event.currency || "CAD";
    document.getElementById("eventTitle").textContent = event.name;

    const itemsRoot = document.getElementById("items");
    itemsRoot.innerHTML = Object.entries(event.items).map(([id, it]) => `
    <div class="itemRow">
      <div>
        <div class="itemName">${it.item_name}</div>
        <div class="itemPrice">$${it.price} • <span class="badge">${it.remaining_qty} left</span></div>
      </div>
      <input class="qty" type="number" min="0" max="${it.remaining_qty}" value="0" data-id="${id}" />
    </div>
  `).join("");

    const slots = Object.entries(event.slots).filter(([_, s]) => s.remaining > 0);
    document.getElementById("slotSelect").innerHTML = slots.map(([time, s]) => `
    <option value="${time}">${time} (left: ${s.remaining})</option>
  `).join("");
}

loadEvent();
