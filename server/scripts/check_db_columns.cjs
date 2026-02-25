const db = require('./database.cjs');

db.all("PRAGMA table_info(orders)", [], (err, rows) => {
    if (err) {
        console.error("Error:", err);
        return;
    }
    console.log("Columns:", rows.map(r => r.name));

    // Check if shipping columns exist
    const hasShippingCompany = rows.some(r => r.name === 'shippingCompany');
    const hasTracking = rows.some(r => r.name === 'trackingNumber');

    console.log("Has shippingCompany:", hasShippingCompany);
    console.log("Has trackingNumber:", hasTracking);
});
