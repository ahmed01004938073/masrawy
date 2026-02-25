// Test API connection
const API_URL = 'http://localhost:3001/api';

async function testAPI() {
    console.log('🧪 Testing API connection...\n');

    try {
        // Test 1: Get employees
        console.log('📡 Fetching employees from API...');
        const response = await fetch(`${API_URL}/kv/employees`);

        if (!response.ok) {
            console.error('❌ API Error:', response.status, response.statusText);
            return;
        }

        const employees = await response.json();
        console.log('✅ API Response:', employees);

        if (employees && employees.length > 0) {
            console.log(`\n📊 Found ${employees.length} employees:`);
            employees.forEach(emp => {
                console.log(`  - ${emp.name} (${emp.email})`);
            });
        } else {
            console.log('⚠️ No employees found in API response');
        }

    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
}

testAPI();
