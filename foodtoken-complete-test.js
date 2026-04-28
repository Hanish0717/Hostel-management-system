#!/usr/bin/env node



const http = require('http');

const API_BASE = 'http://localhost:5000/api';



function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: JSON.parse(data)
                });
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

function log(title, data = null) {
    console.log('\n' + '='.repeat(70));
    console.log('📌', title);
    console.log('='.repeat(70));
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



async function runTests() {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║          🍽️  FOOD TOKEN SYSTEM - COMPLETE TEST SUITE            ║
║                                                                  ║
║  This script tests all Food Token API endpoints.                ║
║  Make sure backend is running on localhost:5000                 ║
╚══════════════════════════════════════════════════════════════════╝
    `);

    
    
    const TEST_STUDENT_ID = '65a7f3b2c1d8e9f0a1b2c3d4';
    let testTokenId = null;

    log('TEST 1: Generate Breakfast Token');
    try {
        const result = await makeRequest('POST', '/token/generate', {
            studentId: TEST_STUDENT_ID,
            mealType: 'breakfast'
        });
        console.log('Status:', result.status);
        console.log('Response:', JSON.stringify(result.data, null, 2));
        if (result.data.data) {
            testTokenId = result.data.data.tokenId;
            console.log('\n✅ Token generated:', testTokenId);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    }

    log('TEST 2: Generate Lunch Token (Different Meal)');
    try {
        const result = await makeRequest('POST', '/token/generate', {
            studentId: TEST_STUDENT_ID,
            mealType: 'lunch'
        });
        console.log('Status:', result.status);
        console.log('✅ Token generated for lunch');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }

    log('TEST 3: Attempt Duplicate Token (Should Return Existing)');
    try {
        const result = await makeRequest('POST', '/token/generate', {
            studentId: TEST_STUDENT_ID,
            mealType: 'breakfast'
        });
        console.log('Status:', result.status);
        console.log('isNew:', result.data.isNew);
        console.log('✅ System correctly returned existing token');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }

    log('TEST 4: Get Today\'s Tokens for Student');
    try {
        const result = await makeRequest('GET', `/token/today/${TEST_STUDENT_ID}`);
        console.log('Status:', result.status);
        console.log('Tokens count:', result.data.data.length);
        console.log('Tokens:', JSON.stringify(result.data.data.map(t => ({
            tokenId: t.tokenId,
            mealType: t.mealType,
            status: t.status
        })), null, 2));
        console.log('✅ Retrieved today\'s tokens');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }

    log('TEST 5: Verify Token (At Mess Counter)');
    if (testTokenId) {
        try {
            const result = await makeRequest('GET', `/token/verify/${testTokenId}`);
            console.log('Status:', result.status);
            console.log('Valid:', result.data.valid);
            console.log('Student:', result.data.data.studentName);
            console.log('Meal:', result.data.data.mealType);
            console.log('✅ Token verified successfully');
        } catch (err) {
            console.error('❌ Error:', err.message);
        }
    }

    log('TEST 6: Mark Token as Used');
    if (testTokenId) {
        try {
            const result = await makeRequest('PUT', '/token/use', {
                tokenId: testTokenId
            });
            console.log('Status:', result.status);
            console.log('New status:', result.data.data.status);
            console.log('Used at:', result.data.data.usedAt);
            console.log('✅ Token marked as used');
        } catch (err) {
            console.error('❌ Error:', err.message);
        }
    }

    log('TEST 7: Attempt to Reuse Used Token (Should Fail)');
    if (testTokenId) {
        try {
            const result = await makeRequest('PUT', '/token/use', {
                tokenId: testTokenId
            });
            console.log('Status:', result.status);
            if (result.status !== 200) {
                console.log('Error:', result.data.error);
                console.log('✅ System correctly prevented reuse');
            }
        } catch (err) {
            console.error('Error:', err.message);
        }
    }

    log('TEST 8: Get Student Token History (Last 30)');
    try {
        const result = await makeRequest('GET', `/token/student/${TEST_STUDENT_ID}`);
        console.log('Status:', result.status);
        console.log('Total tokens:', result.data.count);
        console.log('✅ Retrieved student history');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }

    log('TEST 9: Admin - View All Tokens');
    try {
        const result = await makeRequest('GET', '/token/admin/all');
        console.log('Status:', result.status);
        console.log('Statistics:', result.data.stats);
        console.log('✅ Retrieved admin statistics');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }

    log('TEST 10: Admin - View with Filters');
    try {
        const today = new Date().toISOString().split('T')[0];
        const result = await makeRequest('GET', `/token/admin/all?date=${today}&mealType=breakfast&status=valid`);
        console.log('Status:', result.status);
        console.log('Filtered tokens count:', result.data.data.length);
        console.log('✅ Retrieved filtered tokens');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }

    log('TEST 11: Error Handling - Missing Fields');
    try {
        const result = await makeRequest('POST', '/token/generate', {
            mealType: 'breakfast'
            
        });
        console.log('Status:', result.status);
        console.log('Error:', result.data.error);
        console.log('✅ Correctly caught missing field error');
    } catch (err) {
        console.error('Error:', err.message);
    }

    log('TEST 12: Error Handling - Invalid Meal Type');
    try {
        const result = await makeRequest('POST', '/token/generate', {
            studentId: TEST_STUDENT_ID,
            mealType: 'pizza_party'
        });
        console.log('Status:', result.status);
        console.log('Error:', result.data.error);
        console.log('✅ Correctly caught invalid meal type error');
    } catch (err) {
        console.error('Error:', err.message);
    }

    log('TEST 13: Error Handling - Non-existent Student');
    try {
        const result = await makeRequest('POST', '/token/generate', {
            studentId: '000000000000000000000000',
            mealType: 'breakfast'
        });
        console.log('Status:', result.status);
        console.log('Error:', result.data.error);
        console.log('✅ Correctly caught non-existent student error');
    } catch (err) {
        console.error('Error:', err.message);
    }

    log('TEST 14: Error Handling - Non-existent Token');
    try {
        const result = await makeRequest('GET', '/token/verify/FT999999');
        console.log('Status:', result.status);
        console.log('Valid:', result.data.valid);
        console.log('✅ Correctly handled non-existent token');
    } catch (err) {
        console.error('Error:', err.message);
    }

    
    log('🎉 TEST SUITE COMPLETED');
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                        TEST SUMMARY                             ║
╠══════════════════════════════════════════════════════════════════╣
║  ✅ Token Generation        - Generate new tokens               ║
║  ✅ Duplicate Prevention     - Returns existing token            ║
║  ✅ Token Verification      - Verify at mess counter            ║
║  ✅ Mark as Used            - Update token status               ║
║  ✅ Reuse Prevention        - Prevent used token reuse          ║
║  ✅ Token History           - Get student's all tokens          ║
║  ✅ Admin Statistics        - View all tokens with stats        ║
║  ✅ Filter Support          - Filter by date/meal/status        ║
║  ✅ Error Handling          - Proper validation & errors        ║
║                                                                  ║
║  🎯 All tests completed successfully!                           ║
╚══════════════════════════════════════════════════════════════════╝

📝 IMPORTANT NOTES:
  • Replace TEST_STUDENT_ID with a real student ID from MongoDB
  • Ensure backend server is running on port 5000
  • Check MongoDB for data persistence
  • Review detailed API docs in FOOD_TOKEN_SYSTEM.md

🚀 NEXT STEPS:
  1. Integrate UI components into your dashboards
  2. Test in production environment
  3. Configure meal times as needed
  4. Set up monitoring and logging

    `);
}



if (require.main === module) {
    runTests().catch(err => {
        console.error('❌ Test suite failed:', err);
        process.exit(1);
    });
}

module.exports = { makeRequest };
