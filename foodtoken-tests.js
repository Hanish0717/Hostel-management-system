


const API_URL = "http://localhost:5000/api";


async function apiCall(endpoint, method = "GET", body = null) {
    try {
        const options = {
            method,
            headers: { "Content-Type": "application/json" }
        };

        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();

        console.log(`✅ ${method} ${endpoint}`);
        console.table(data);
        return data;
    } catch (err) {
        console.error(`❌ Error:`, err);
    }
}


async function test_generateToken() {
    console.log("\n🧪 TEST 1: Generate Food Token");
    console.log("=====================================");

    
    
    const studentId = "65a7f3b2c1d8e9f0a1b2c3d4"; 

    const result = await apiCall("/token/generate", "POST", {
        studentId,
        mealType: "breakfast"
    });

    if (result.data) {
        console.log("\n📊 Token Details:");
        console.log(`   Token ID: ${result.data.tokenId}`);
        console.log(`   Status: ${result.data.status}`);
        console.log(`   Expires: ${result.data.expiresAt}`);
        console.log(`   Is New: ${result.isNew}`);
    }
}


async function test_generateAllMeals() {
    console.log("\n🧪 TEST 2: Generate Tokens for All Meals");
    console.log("=====================================");

    const studentId = "65a7f3b2c1d8e9f0a1b2c3d4"; 
    const meals = ["breakfast", "lunch", "dinner"];

    for (const meal of meals) {
        console.log(`\n🍽️ Generating ${meal} token...`);
        await apiCall("/token/generate", "POST", {
            studentId,
            mealType: meal
        });
    }
}


async function test_getTodayTokens() {
    console.log("\n🧪 TEST 3: Get Today's Tokens for Student");
    console.log("=====================================");

    const studentId = "65a7f3b2c1d8e9f0a1b2c3d4"; 
    await apiCall(`/token/today/${studentId}`);
}


async function test_verifyToken() {
    console.log("\n🧪 TEST 4: Verify Token at Mess Counter");
    console.log("=====================================");

    
    
    const tokenId = "FT123456"; 

    await apiCall(`/token/verify/${tokenId}`);
}


async function test_useToken() {
    console.log("\n🧪 TEST 5: Mark Token as Used (Mess Staff)");
    console.log("=====================================");

    
    const tokenId = "FT123456"; 

    const result = await apiCall("/token/use", "PUT", { tokenId });

    if (result.data) {
        console.log("\n✅ Token Successfully Used!");
        console.log(`   Used at: ${result.data.usedAt}`);
    }
}


async function test_reuseToken() {
    console.log("\n🧪 TEST 6: Attempt to Reuse Already Used Token");
    console.log("=====================================");

    const tokenId = "FT123456"; 

    const result = await apiCall("/token/use", "PUT", { tokenId });

    if (result.error === "TOKEN_ALREADY_USED") {
        console.log("\n✅ Correctly prevented reuse!");
    }
}


async function test_studentHistory() {
    console.log("\n🧪 TEST 7: Get Student's Token History (Last 30)");
    console.log("=====================================");

    const studentId = "65a7f3b2c1d8e9f0a1b2c3d4"; 
    await apiCall(`/token/student/${studentId}`);
}


async function test_adminViewAll() {
    console.log("\n🧪 TEST 8: Admin - View All Tokens with Filters");
    console.log("=====================================");

    
    console.log("\n📊 All tokens:");
    await apiCall("/token/admin/all");

    
    console.log("\n📅 Tokens for specific date:");
    await apiCall("/token/admin/all?date=2026-04-27");

    
    console.log("\n🍽️ Tokens for breakfast only:");
    await apiCall("/token/admin/all?mealType=breakfast");

    
    console.log("\n📈 Used tokens only:");
    await apiCall("/token/admin/all?status=used");

    
    console.log("\n🔍 Breakfast tokens used today:");
    await apiCall("/token/admin/all?date=2026-04-27&mealType=breakfast&status=used");
}


async function test_errorHandling() {
    console.log("\n🧪 TEST 9: Error Handling");
    console.log("=====================================");

    
    console.log("\n❌ Test missing fields:");
    await apiCall("/token/generate", "POST", { mealType: "breakfast" });

    
    console.log("\n❌ Test invalid meal type:");
    await apiCall("/token/generate", "POST", {
        studentId: "65a7f3b2c1d8e9f0a1b2c3d4",
        mealType: "lunch_special"
    });

    
    console.log("\n❌ Test non-existent student:");
    await apiCall("/token/generate", "POST", {
        studentId: "000000000000000000000000",
        mealType: "breakfast"
    });

    
    console.log("\n❌ Test non-existent token:");
    await apiCall("/token/verify/FT999999");
}


async function test_duplicateToken() {
    console.log("\n🧪 TEST 10: Duplicate Token - Should Return Existing");
    console.log("=====================================");

    const studentId = "65a7f3b2c1d8e9f0a1b2c3d4"; 

    console.log("\n📝 First generation:");
    const first = await apiCall("/token/generate", "POST", {
        studentId,
        mealType: "lunch"
    });

    console.log("\n📝 Second generation (should return existing):");
    const second = await apiCall("/token/generate", "POST", {
        studentId,
        mealType: "lunch"
    });

    if (first.data.tokenId === second.data.tokenId && !second.isNew) {
        console.log("\n✅ Correctly returned existing token!");
    }
}


async function test_cancelToken() {
    console.log("\n🧪 TEST 11: Cancel Token (Admin)");
    console.log("=====================================");

    const tokenId = "FT123456"; 
    await apiCall(`/token/cancel/${tokenId}`, "DELETE");
}


async function runAllTests() {
    console.clear();
    console.log("🚀 FOOD TOKEN SYSTEM - COMPLETE TEST SUITE");
    console.log("==========================================\n");

    
    console.log("⚠️  IMPORTANT: Update student IDs in test functions before running!\n");

    try {
        
        await test_generateToken();
        await test_getTodayTokens();
        await test_verifyToken();

        
        await test_useToken();
        await test_reuseToken();

        
        await test_adminViewAll();

        
        await test_errorHandling();

        
        await test_duplicateToken();
        await test_generateAllMeals();
        await test_studentHistory();

        console.log("\n✅ All tests completed!");
    } catch (err) {
        console.error("❌ Test suite failed:", err);
    }
}


console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🍽️ FOOD TOKEN SYSTEM - QUICK TEST GUIDE              ║
╚════════════════════════════════════════════════════════════════╝

📋 STEP 1: Get a Real Student ID
   - Open MongoDB and find a student in the 'users' collection
   - Copy their _id (ObjectId)
   - Replace "65a7f3b2c1d8e9f0a1b2c3d4" in tests with your ID

📋 STEP 2: Run Individual Tests
   test_generateToken()
   test_getTodayTokens()
   test_verifyToken()
   test_useToken()
   test_adminViewAll()
   test_errorHandling()

📋 STEP 3: Run Complete Suite
   runAllTests()

📋 AVAILABLE TEST FUNCTIONS:
   ✓ test_generateToken()          - Create a new token
   ✓ test_getTodayTokens()         - View today's tokens
   ✓ test_verifyToken()            - Check token validity
   ✓ test_useToken()               - Mark as used
   ✓ test_reuseToken()             - Test reuse prevention
   ✓ test_studentHistory()         - Get all tokens
   ✓ test_adminViewAll()           - Admin view with filters
   ✓ test_errorHandling()          - Test error cases
   ✓ test_duplicateToken()         - Test duplicate handling
   ✓ test_generateAllMeals()       - Create all meal tokens
   ✓ test_cancelToken()            - Cancel a token
   ✓ runAllTests()                 - Run entire suite

💡 TIPS:
   - Open browser DevTools console (F12) to see responses
   - Check MongoDB to verify data is saved
   - Use test_adminViewAll() to see database state
   - Replace all student IDs with real ones from your DB

🔗 ENDPOINTS:
   POST   /api/token/generate         - Create token
   GET    /api/token/today/:studentId - Today's tokens
   GET    /api/token/verify/:tokenId  - Verify token
   GET    /api/token/student/:studentId - History
   PUT    /api/token/use              - Mark as used
   GET    /api/token/admin/all        - Admin view
   DELETE /api/token/cancel/:tokenId  - Cancel

`);
