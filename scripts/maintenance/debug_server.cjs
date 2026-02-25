const express = require('express');
const db = require('../../server/database.cjs');
const app = express();

app.use(express.json());

// Mock request to settings (KV) to reproduce error
async function test() {
    console.log("Testing Database connection...");

    try {
        await new Promise((resolve, reject) => {
            db.get("SELECT 1", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log("✅ Database connection successful.");
    } catch (e) {
        console.error("❌ Database Error:", e);
        return;
    }

    console.log("\nTesting KV Route logic...");
    try {
        const settingsRoutes = require('../../server/routes/settingsRoutes.cjs');
        console.log("✅ Settings routes loaded.");
    } catch (e) {
        console.error("❌ Failed to load settings routes:", e);
    }

    console.log("\nTesting Product Route logic...");
    try {
        const productRoutes = require('../../server/routes/productRoutes.cjs');
        console.log("✅ Product routes loaded.");
    } catch (e) {
        console.error("❌ Failed to load product routes:", e);
    }
}

test();
