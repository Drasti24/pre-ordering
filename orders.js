// --------------------
// order.js
// --------------------

// Get the event slug from URL (e.g., event.html?event=diwali-2025)
const slug = new URLSearchParams(location.search).get("event");

// --------------------
// Load Event Function
// --------------------
async function loadEvent() {
    const snap = await db.ref(`events/${slug}`).get();
    const event = snap.val();

    if (!event || !event.active) {
        alert("Event not found or inactive");
        return;
    }

    document.getElementById("eventTitle").textContent = event.name;
    const currency = event.currency || "CAD";

    // Render Menu Items
    const itemsRoot = document.getElementById("items");
    itemsRoot.innerHTML = Object.entries(event.items).map(([id, it]) => `
        <div class="itemRow">
            <div>
                <div class="itemName">${it.item_name}</div>
                <div class="itemPrice">$${it.price} • 
                    <span class="badge">${it.remaining_qty} left</span>
                </div>
            </div>
            <input class="qty" type="number" min="0" 
                   max="${it.remaining_qty}" value="0" data-id="${id}" />
        </div>
    `).join("");

    // Render Pickup Slots (only those with remaining > 0)
    const slots = Object.entries(event.slots).filter(([_, s]) => s.remaining > 0);
    document.getElementById("slotSelect").innerHTML = slots.map(([time, s]) => `
        <option value="${time}">${time} (left: ${s.remaining})</option>
    `).join("");
}

// --------------------
// Handle Form Submit
// --------------------
document.getElementById("orderForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const order = {
        name: formData.get("buyer_name"),
        phone: formData.get("phone"),
        email: formData.get("email") || "",
        slot_time: formData.get("slot_time"),
        items: [],
        timestamp: Date.now()
    };

    // Collect selected item quantities
    document.querySelectorAll(".qty").forEach(input => {
        const qty = parseInt(input.value);
        if (qty > 0) {
            order.items.push({
                id: input.dataset.id,
                qty: qty
            });
        }
    });

    if (order.items.length === 0) {
        document.getElementById("msg").textContent = "Please select at least one item.";
        return;
    }

    // Save order in /orders/<event_slug>/
    const orderRef = db.ref(`orders/${slug}`).push();
    await orderRef.set(order);

    // --------------------
    // Update Firebase Inventory
    // --------------------

    // 1️⃣ Update each item’s remaining quantity
    for (const item of order.items) {
        const itemRef = db.ref(`events/${slug}/items/${item.id}/remaining_qty`);
        await itemRef.transaction(current => {
            if (current === null || current === undefined) return 0;
            const newVal = current - item.qty;
            return newVal < 0 ? 0 : newVal;
        });
    }

    // 2️⃣ Update the selected pickup slot’s remaining count
    const slotRef = db.ref(`events/${slug}/slots/${order.slot_time}/remaining`);
    await slotRef.transaction(current => {
        if (current === null || current === undefined) return 0;
        const newVal = current - 1;
        return newVal < 0 ? 0 : newVal;
    });

    // --------------------
    // Show Success Message + Refresh UI
    // --------------------
    document.getElementById("msg").innerHTML = `<span style="color:green;">✅ Order placed!</span>`;
    form.reset();

    // Reload event to show updated counts
    await loadEvent();
});

// --------------------
// Initialize
// --------------------
loadEvent();
