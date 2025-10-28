document.getElementById("orderForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const order = {
        name: formData.get("buyer_name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        slot_time: formData.get("slot_time"),
        items: [],
        timestamp: Date.now(),
    };

    let hasItems = false;

    document.querySelectorAll(".qty").forEach(input => {
        const qty = parseInt(input.value);
        if (qty > 0) {
            hasItems = true;
            order.items.push({
                id: input.dataset.id,
                qty: qty
            });
        }
    });

    if (!hasItems) {
        document.getElementById("msg").textContent = "Please select at least one item.";
        return;
    }

    const slug = new URLSearchParams(location.search).get("event");
    const orderRef = db.ref(`orders/${slug}`).push();
    await orderRef.set(order);

    // 🧩 Sanitize slot key
    const safeSlotKey = order.slot_time.replace(/[.#$/\[\]:]/g, "-");

    // ✅ Update inventory
    for (const item of order.items) {
        const itemRef = db.ref(`events/${slug}/items/${item.id}/remaining_qty`);
        await itemRef.transaction(current => {
            if (current === null || current === undefined) return 0;
            const newVal = current - item.qty;
            return newVal < 0 ? 0 : newVal;
        });
    }

    // ✅ Update slot count
    const slotRef = db.ref(`events/${slug}/slots/${safeSlotKey}/remaining`);
    await slotRef.transaction(current => {
        if (current === null || current === undefined) return 0;
        const newVal = current - 1;
        return newVal < 0 ? 0 : newVal;
    });

    document.getElementById("msg").innerHTML = `<span style="color: green;">✅ Order placed!</span>`;
    form.reset();

    // 🔁 Reload event to reflect new quantities
    loadEvent();
});
