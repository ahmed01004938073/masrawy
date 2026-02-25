const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Creating Test Order...");

// 1. Get/Update a product
const TEST_PRODUCT_NAME = "Test Product For Report";
const SELLING_PRICE = 1000;
const WHOLESALE_PRICE = 500;

db.serialize(() => {
    // Upsert Product (Simpler to just update an existing one or insert if not exists, but let's just pick one)
    db.get("SELECT * FROM products LIMIT 1", (err, product) => {
        if (err || !product) {
            console.error("No products found to test with.");
            return;
        }

        const productId = product.id;
        console.log(`Using Product: ${product.name} (${productId})`);

        // Update its prices
        db.run("UPDATE products SET price = ?, wholesalePrice = ? WHERE id = ?", [SELLING_PRICE, WHOLESALE_PRICE, productId], (err) => {
            if (err) {
                console.error("Failed to update product prices:", err);
                return;
            }
            console.log(`Updated Product Prices: Selling=${SELLING_PRICE}, Wholesale=${WHOLESALE_PRICE}`);

            // 2. Create Order
            const orderId = `ord-${Date.now()}`;
            const orderNumber = Math.floor(100000 + Math.random() * 900000);
            const items = [{
                id: `item-${Date.now()}`,
                productId: productId,
                productName: product.name,
                price: SELLING_PRICE, // User selling price (same as base for now, or higher)
                quantity: 1,
                total: SELLING_PRICE,
                image: product.thumbnail || ""
            }];

            const order = {
                id: orderId,
                orderNumber: orderNumber,
                customerName: "Test Client",
                customerPhone: "01000000000",
                items: JSON.stringify(items),
                status: "delivered", // Important: Must be delivered to show in report
                totalAmount: SELLING_PRICE,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                page: "in_delivery"
            };

            const sql = `INSERT INTO orders (id, orderNumber, customerName, customerPhone, items, status, totalAmount, createdAt, updatedAt, page) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            db.run(sql, [order.id, order.orderNumber, order.customerName, order.customerPhone, order.items, order.status, order.totalAmount, order.createdAt, order.updatedAt, order.page], (err) => {
                if (err) {
                    console.error("Failed to insert order:", err);
                } else {
                    console.log(`✅ Test Order Created: #${orderNumber}`);
                    console.log(`Expected Profit Calculation: (Selling ${SELLING_PRICE} - Wholesale ${WHOLESALE_PRICE}) * 1 = ${SELLING_PRICE - WHOLESALE_PRICE}`);
                }
            });
        });
    });
});
