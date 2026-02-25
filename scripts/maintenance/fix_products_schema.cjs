const db = require('../../server/database.cjs');

// Helper to promisify query/execute
function query(conn, sql, params = []) {
    return new Promise((resolve, reject) => {
        if (conn.all) {
            conn.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        } else if (conn.execute) {
            conn.execute(sql, params, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        } else {
            reject(new Error('Unknown connection type'));
        }
    });
}

async function fixSchema() {
    console.log('--- Fixing Products Schema ---');

    try {
        // 1. Add status column
        console.log('1. Adding `status` column...');
        try {
            await query(db, "ALTER TABLE products ADD COLUMN status ENUM('active', 'inactive', 'archived', 'draft') DEFAULT 'active'");
            console.log('   `status` column added.');
        } catch (e) {
            if (e && (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column'))) {
                console.log('   `status` column already exists.');
            } else {
                console.error('   Error adding `status` column:', e.message);
            }
        }

        // 2. Ensure category_id exists (it mostly does based on previous checks, but good to be safe)
        // Previous check showed it exists.

        // 3. Update existing null status to 'active'
        console.log('2. Setting default status for existing products...');
        const connection = await db.getConnection();

        // Promisify basic connection execute
        const exec = (sql, params) => new Promise((resolve, reject) => {
            connection.execute(sql, params, (err, res) => err ? reject(err) : resolve(res));
        });

        await exec("UPDATE products SET status = 'active' WHERE status IS NULL");
        console.log('   Status updated.');

        connection.release();

    } catch (e) {
        console.error('Schema Fix Failed:', e);
    } finally {
        process.exit(0);
    }
}

fixSchema();
