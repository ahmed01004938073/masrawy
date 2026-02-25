async function checkApiResponse() {
    try {
        console.log("Fetching /api/categories...");
        const response = await fetch('http://localhost:3001/api/categories');
        const data = await response.json();

        // If it's paginated, look at data field
        const list = Array.isArray(data) ? data : (data.data || []);

        console.log("API Categories Response (First 3):");
        list.slice(0, 3).forEach(cat => {
            console.log(`- ID: ${cat.id}, Name: ${cat.name}, Active: ${cat.active} (${typeof cat.active}), Status: ${cat.status}`);
        });

        if (list.length > 0) {
            const first = list[0];
            console.log("\nRaw first category object:", JSON.stringify(first, null, 2));
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkApiResponse();
