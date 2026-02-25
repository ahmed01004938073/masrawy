// Test login logic
const API_URL = 'http://localhost:3001/api';

async function testLogin(identifier, password) {
    console.log('🔐 Testing login...');
    console.log('📝 Input:', { identifier, password });

    try {
        // Get employees from API
        const response = await fetch(`${API_URL}/kv/employees`);
        const employees = await response.json();

        // Search logic (same as service)
        const lowerIdentifier = identifier.toLowerCase().trim();
        console.log('🧹 Clean identifier:', lowerIdentifier);

        let employee = employees.find((emp) => emp.email.toLowerCase() === lowerIdentifier);

        if (!employee) {
            employee = employees.find((emp) => emp.name.toLowerCase() === lowerIdentifier);
        }

        if (!employee) {
            console.error('❌ Employee not found');
            return;
        }

        console.log('✅ Employee found:', employee.name);
        console.log('📧 Email:', employee.email);
        console.log('🔑 Stored password:', employee.password);
        console.log('🔑 Input password:', password);
        console.log('🔍 Password match:', employee.password === password);

        if (employee.password === password.trim()) {
            console.log('✅ Login successful!');
        } else {
            console.log('❌ Password mismatch!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Test with the credentials
testLogin('admin@afleet.com', 'admin123');
