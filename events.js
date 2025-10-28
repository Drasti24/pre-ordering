// Get event slug from URL
const slug = new URLSearchParams(location.search).get("event");

// Load event data from Firebase and render
async function loadEvent() {
    const snap = await db.ref(`events/${slug}`).get();
    const event = snap.val();

    if (!event || !event.active) {
        alert("Event not found or inactive");
        return;
    }

    document.getElementById("eventTitle").textContent = event.name;
    let currency = event.currency || "CAD";

    // Render menu items
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

    // Render pickup slots
    const slots = Object.entries(event.slots).filter(([_, s]) => s.remaining > 0);
    document.getElementById("slotSelect").innerHTML = slots.map(([time, s]) => `
        <option value="${time}">${time} (left: ${s.remaining})</option>
    `).join("");
}

// Handle form submission (order placement)
document.getElementById("orderForm").addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent default page reload

    const form = e.target;
    const formData = new FormData(form);
    const order = Object.fromEntries(formData.entries());

    // Collect item quantities
    const quantities = [...document.querySelectorAll(".qty")]
        .map(input => [input.dataset.id, parseInt(input.value)])
        .filter(([_, qty]) => qty > 0);

    if (quantities.length === 0) {
        document.getElementById("msg").textContent = "Please select at least one item.";
        return;
    }

    order.items = Object.fromEntries(quantities);
    order.timestamp = Date.now();

    try {
        // Save order to Firebase under the event slug
        await db.ref(`orders/${slug}`).push(order);
        document.getElementById("msg").textContent = "✅ Order placed!";
        form.reset();
        // You may also want to reload the event to reflect updated quantities:
        // await loadEvent();
    } catch (err) {
        console.error("Error placing order:", err);
        document.getElementById("msg").textContent = "❌ Failed to place order. Please try again.";
    }
});

// Initial load
loadEvent();
