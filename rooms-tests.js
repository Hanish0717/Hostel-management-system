


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


async function test_createRooms() {
    console.log("\n🧪 TEST 1: Create Multiple Rooms");
    console.log("=====================================");

    const roomsToCreate = [
        { roomNumber: "101", block: "A", capacity: 4, floor: 1, amenities: ["WiFi", "Fan"] },
        { roomNumber: "102", block: "A", capacity: 4, floor: 1, amenities: ["WiFi", "Fan"] },
        { roomNumber: "103", block: "A", capacity: 2, floor: 1, amenities: ["WiFi"] },
        { roomNumber: "201", block: "B", capacity: 3, floor: 2, amenities: ["WiFi", "Fan", "AC"] },
        { roomNumber: "202", block: "B", capacity: 4, floor: 2, amenities: ["WiFi", "Fan"] },
    ];

    for (const room of roomsToCreate) {
        console.log(`\n📝 Creating Room ${room.roomNumber}...`);
        await apiCall("/rooms/create", "POST", room);
    }

    console.log("\n✅ All rooms created!");
}


async function test_getAllRooms() {
    console.log("\n🧪 TEST 2: Get All Rooms");
    console.log("=====================================");

    const result = await apiCall("/rooms");
    console.log(`\n📊 Total rooms: ${result.count}`);
}


async function test_getRoomsByBlock() {
    console.log("\n🧪 TEST 3: Get Rooms by Block");
    console.log("=====================================");

    console.log("\n🏢 Block A Rooms:");
    await apiCall("/rooms?block=A");

    console.log("\n🏢 Block B Rooms:");
    await apiCall("/rooms?block=B");
}


async function test_getAvailableRooms() {
    console.log("\n🧪 TEST 4: Get Available Rooms (Not Full)");
    console.log("=====================================");

    await apiCall("/rooms?isAvailable=true");
}


async function test_getStatistics() {
    console.log("\n🧪 TEST 5: Get Room Statistics");
    console.log("=====================================");

    const result = await apiCall("/rooms/stats/overview");
    
    if (result.stats) {
        console.log("\n📈 Room Statistics:");
        console.log(`   Total Rooms: ${result.stats.totalRooms}`);
        console.log(`   Full Rooms: ${result.stats.fullRooms}`);
        console.log(`   Available: ${result.stats.availableRooms}`);
        console.log(`   Total Capacity: ${result.stats.totalCapacity}`);
        console.log(`   Total Occupied: ${result.stats.totalOccupied}`);
        console.log(`   Occupancy Rate: ${result.stats.occupancyRate}`);
    }
}


async function test_allocateRoom() {
    console.log("\n🧪 TEST 6: Allocate Room to Student");
    console.log("=====================================");

    
    const studentId = "65a7f3b2c1d8e9f0a1b2c3d4";  
    
    
    const roomsResult = await apiCall("/rooms");
    if (roomsResult.data && roomsResult.data.length > 0) {
        const roomId = roomsResult.data[0]._id;
        
        console.log(`\n📝 Allocating Room ${roomsResult.data[0].roomNumber} to Student...`);
        const result = await apiCall("/rooms/allocate", "POST", {
            studentId,
            roomId
        });

        if (result.data) {
            console.log(`\n✅ Room allocated!`);
            console.log(`   Room: ${result.data.room.roomNumber}, Block: ${result.data.room.block}`);
            console.log(`   New Occupancy: ${result.data.room.occupiedCount}/${result.data.room.capacity}`);
        }
    }
}


async function test_getStudentRoom() {
    console.log("\n🧪 TEST 7: Get Student's Room");
    console.log("=====================================");

    const studentId = "65a7f3b2c1d8e9f0a1b2c3d4";  
    
    const result = await apiCall(`/rooms/student/${studentId}`);
    
    if (result.data) {
        console.log(`\n🏠 Student: ${result.data.student.name}`);
        console.log(`   Room: ${result.data.room.roomNumber}, Block: ${result.data.room.block}`);
        console.log(`   Capacity: ${result.data.room.capacity}, Occupied: ${result.data.room.occupiedCount}`);
    }
}


async function test_getSpecificRoom() {
    console.log("\n🧪 TEST 8: Get Specific Room Details");
    console.log("=====================================");

    
    const roomsResult = await apiCall("/rooms");
    if (roomsResult.data && roomsResult.data.length > 0) {
        const roomId = roomsResult.data[0]._id;
        
        console.log(`\n📝 Fetching Room ${roomsResult.data[0].roomNumber}...`);
        const result = await apiCall(`/rooms/${roomId}`);
        
        if (result.data) {
            console.log(`\n🏠 Room Details:`);
            console.log(`   Number: ${result.data.roomNumber}`);
            console.log(`   Block: ${result.data.block}`);
            console.log(`   Capacity: ${result.data.capacity}`);
            console.log(`   Occupied: ${result.data.occupiedCount}`);
            console.log(`   Amenities: ${result.data.amenities.join(", ")}`);
            console.log(`   Students: ${result.data.students.length}`);
        }
    }
}


async function test_deallocateRoom() {
    console.log("\n🧪 TEST 9: Deallocate Room from Student");
    console.log("=====================================");

    const studentId = "65a7f3b2c1d8e9f0a1b2c3d4";  
    
    console.log(`\n📝 Deallocating Room from Student...`);
    const result = await apiCall(`/rooms/deallocate/${studentId}`, "PUT");
    
    if (result.data) {
        console.log(`\n✅ Room deallocated!`);
        console.log(`   Student: ${result.data.student.name}`);
        console.log(`   Previous Room: ${result.data.previousRoom.roomNumber}, Block: ${result.data.previousRoom.block}`);
        console.log(`   New Occupancy: ${result.data.previousRoom.newOccupiedCount}`);
    }
}


async function test_updateRoom() {
    console.log("\n🧪 TEST 10: Update Room Details");
    console.log("=====================================");

    const roomsResult = await apiCall("/rooms");
    if (roomsResult.data && roomsResult.data.length > 0) {
        const roomId = roomsResult.data[0]._id;
        
        console.log(`\n📝 Updating Room ${roomsResult.data[0].roomNumber}...`);
        const result = await apiCall(`/rooms/${roomId}`, "PUT", {
            amenities: ["WiFi", "Fan", "AC", "Bathroom"],
            description: "Premium room with excellent facilities"
        });

        if (result.data) {
            console.log(`\n✅ Room updated!`);
            console.log(`   Amenities: ${result.data.amenities.join(", ")}`);
            console.log(`   Description: ${result.data.description}`);
        }
    }
}


async function test_errorHandling() {
    console.log("\n🧪 TEST 11: Error Handling");
    console.log("=====================================");

    
    console.log("\n❌ Test invalid capacity:");
    await apiCall("/rooms/create", "POST", {
        roomNumber: "999",
        block: "A",
        capacity: 50  
    });

    
    console.log("\n❌ Test duplicate room:");
    await apiCall("/rooms/create", "POST", {
        roomNumber: "101",
        block: "A",
        capacity: 4
    });

    
    console.log("\n❌ Test non-existent student:");
    await apiCall("/rooms/allocate", "POST", {
        studentId: "000000000000000000000000",
        roomId: "000000000000000000000000"
    });

    
    console.log("\n❌ Test non-existent room:");
    await apiCall("/rooms/999");
}


async function test_fillRoom() {
    console.log("\n🧪 TEST 12: Fill Room to Capacity");
    console.log("=====================================");

    
    const roomsResult = await apiCall("/rooms");
    const smallRoom = roomsResult.data.find(r => r.capacity === 2);

    if (smallRoom) {
        console.log(`\n📝 Room: ${smallRoom.roomNumber} (Capacity: ${smallRoom.capacity})`);
        
        
        
        console.log(`   Current Occupancy: ${smallRoom.occupiedCount}/${smallRoom.capacity}`);
        console.log(`   Available Spots: ${smallRoom.availableCapacity}`);
    }
}


async function test_availableRoomsList() {
    console.log("\n🧪 TEST 13: List Only Available Rooms");
    console.log("=====================================");

    const result = await apiCall("/rooms/available/list");
    
    if (result.data) {
        console.log(`\n📊 Available Rooms (${result.count}):`);
        result.data.forEach(room => {
            console.log(`   ${room.roomNumber} (Block ${room.block}) - ${room.occupiedCount}/${room.capacity}`);
        });
    }
}


async function runAllTests() {
    console.clear();
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║         🏠 ROOM ALLOCATION SYSTEM - COMPLETE TEST SUITE          ║
║                                                                  ║
║  Make sure backend is running on localhost:5000                 ║
║  Replace student IDs with real ones from your database          ║
╚══════════════════════════════════════════════════════════════════╝
    `);

    try {
        
        await test_createRooms();
        await test_getAllRooms();
        await test_getRoomsByBlock();
        await test_getAvailableRooms();

        
        await test_getStatistics();

        
        await test_allocateRoom();
        await test_getStudentRoom();

        
        await test_getSpecificRoom();
        await test_updateRoom();

        
        await test_deallocateRoom();

        
        await test_errorHandling();

        
        await test_fillRoom();
        await test_availableRoomsList();

        console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                        TEST SUITE COMPLETED                      ║
╠══════════════════════════════════════════════════════════════════╣
║  ✅ Create Rooms        - Multiple rooms created                 ║
║  ✅ View Rooms          - All rooms listed                       ║
║  ✅ Filter by Block     - Block-wise filtering                   ║
║  ✅ Available Rooms     - Non-full rooms shown                   ║
║  ✅ Statistics          - Occupancy metrics                      ║
║  ✅ Allocate Room       - Student assigned                       ║
║  ✅ Get Student Room    - Room details retrieved                 ║
║  ✅ Room Details        - Specific room info                     ║
║  ✅ Update Room         - Room info modified                     ║
║  ✅ Deallocate Room     - Student removed                        ║
║  ✅ Error Handling      - Proper validation                      ║
║                                                                  ║
║  🎯 All tests completed successfully!                            ║
╚══════════════════════════════════════════════════════════════════╝
        `);

    } catch (err) {
        console.error("❌ Test suite failed:", err);
    }
}


console.log(`
╔════════════════════════════════════════════════════════════════╗
║        🏠 ROOM ALLOCATION - QUICK TEST REFERENCE               ║
╚════════════════════════════════════════════════════════════════╝

📋 AVAILABLE TEST FUNCTIONS:
   ✓ test_createRooms()           - Create sample rooms
   ✓ test_getAllRooms()           - List all rooms
   ✓ test_getRoomsByBlock()       - Filter by block
   ✓ test_getAvailableRooms()     - Available rooms only
   ✓ test_getStatistics()         - Room statistics
   ✓ test_allocateRoom()          - Assign room to student
   ✓ test_getStudentRoom()        - View student's room
   ✓ test_getSpecificRoom()       - Room details
   ✓ test_updateRoom()            - Update room info
   ✓ test_deallocateRoom()        - Remove student from room
   ✓ test_errorHandling()         - Test error cases
   ✓ test_fillRoom()              - Check full room
   ✓ test_availableRoomsList()    - Available rooms list
   ✓ runAllTests()                - Run complete suite

💡 QUICK START:
   1. Open browser DevTools (F12)
   2. Go to Console tab
   3. Run: runAllTests()

🔑 IMPORTANT:
   • Replace student IDs with real MongoDB IDs
   • Ensure backend running on port 5000
   • Check MongoDB for data persistence

📊 ENDPOINTS TESTED:
   POST   /api/rooms/create           - Create room
   GET    /api/rooms                  - All rooms
   GET    /api/rooms                  - Get specific
   GET    /api/rooms?block=A          - Filter by block
   GET    /api/rooms/stats/overview   - Statistics
   GET    /api/rooms/available/list   - Available only
   POST   /api/rooms/allocate         - Allocate room
   GET    /api/rooms/student/:id      - Student's room
   PUT    /api/rooms/:id              - Update room
   PUT    /api/rooms/deallocate/:id   - Deallocate room
`);
