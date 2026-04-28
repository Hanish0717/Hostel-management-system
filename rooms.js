const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const User = require("../models/User");




async function studentHasRoom(studentId) {
    const student = await User.findById(studentId);
    return student && student.roomId ? true : false;
}


async function populateRoomData(roomId) {
    return await Room.findById(roomId).populate("students", "fullName studentId email phone");
}


router.post("/create", async (req, res) => {
    try {
        const { roomNumber, block, capacity, floor, amenities, description } = req.body;

        
        if (!roomNumber || !block || !capacity) {
            return res.status(400).json({
                message: "roomNumber, block, and capacity are required",
                error: "MISSING_FIELDS"
            });
        }

        
        if (capacity < 1 || capacity > 10) {
            return res.status(400).json({
                message: "Capacity must be between 1 and 10",
                error: "INVALID_CAPACITY"
            });
        }

        
        const existingRoom = await Room.findOne({ roomNumber, block });
        if (existingRoom) {
            return res.status(400).json({
                message: `Room ${roomNumber} in Block ${block} already exists`,
                error: "ROOM_EXISTS"
            });
        }

        
        const room = new Room({
            roomNumber,
            block,
            capacity,
            floor: floor || 1,
            amenities: amenities || [],
            description
        });

        const savedRoom = await room.save();

        res.status(201).json({
            message: "Room created successfully",
            data: savedRoom
        });

    } catch (err) {
        console.error("CREATE ROOM ERROR:", err);
        res.status(500).json({
            message: "Error creating room",
            error: err.message
        });
    }
});


router.get("/", async (req, res) => {
    try {
        const { block, isAvailable } = req.query;

        
        let filter = { isActive: true };

        if (block) {
            filter.block = block;
        }

        if (isAvailable === "true") {
            
            filter.$expr = { $lt: ["$occupiedCount", "$capacity"] };
        }

        
        let rooms = await Room.find(filter)
            .populate("students", "fullName studentId email phone room")
            .sort({ block: 1, roomNumber: 1 });

        // Sort by availableSlots (descending) using JavaScript
        rooms = rooms.sort((a, b) => b.availableSlots - a.availableSlots);

        res.json({
            message: "Rooms retrieved successfully",
            count: rooms.length,
            data: rooms
        });

    } catch (err) {
        console.error("FETCH ROOMS ERROR:", err);
        res.status(500).json({
            message: "Error fetching rooms",
            error: err.message
        });
    }
});


router.get("/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;

        
        const room = await Room.findById(roomId)
            .populate("students", "fullName studentId email phone room");

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
                error: "ROOM_NOT_FOUND"
            });
        }

        res.json({
            message: "Room details retrieved",
            data: room
        });

    } catch (err) {
        console.error("FETCH ROOM ERROR:", err);
        res.status(500).json({
            message: "Error fetching room",
            error: err.message
        });
    }
});


router.post("/allocate", async (req, res) => {
    try {
        const { studentId, roomId } = req.body;

        
        if (!studentId || !roomId) {
            return res.status(400).json({
                message: "studentId and roomId are required",
                error: "MISSING_FIELDS"
            });
        }

        
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                error: "STUDENT_NOT_FOUND"
            });
        }

        
        if (student.roomId) {
            return res.status(400).json({
                message: "Student already allocated to a room",
                error: "STUDENT_ALREADY_ALLOCATED",
                currentRoomId: student.roomId
            });
        }

        
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                message: "Room not found",
                error: "ROOM_NOT_FOUND"
            });
        }

        
        if (!room.isActive) {
            return res.status(400).json({
                message: "Room is not active",
                error: "ROOM_INACTIVE"
            });
        }

        
        if (room.occupiedCount >= room.capacity) {
            return res.status(400).json({
                message: `Room is full. Capacity: ${room.capacity}, Occupied: ${room.occupiedCount}`,
                error: "ROOM_FULL",
                capacity: room.capacity,
                occupied: room.occupiedCount
            });
        }

        
        student.roomId = roomId;
        await student.save();

        
        room.students.push(studentId);
        room.occupiedCount += 1;
        await room.save();

        
        const updatedRoom = await Room.findById(roomId)
            .populate("students", "fullName studentId email phone");

        res.status(200).json({
            message: "Room allocated successfully",
            data: {
                student: {
                    id: student._id,
                    name: student.fullName,
                    studentId: student.studentId,
                    roomId: roomId
                },
                room: updatedRoom
            }
        });

    } catch (err) {
        console.error("ALLOCATE ROOM ERROR:", err);
        res.status(500).json({
            message: "Error allocating room",
            error: err.message
        });
    }
});


router.post("/auto-allocate", async (req, res) => {
    try {
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({
                message: "studentId is required",
                error: "MISSING_FIELDS"
            });
        }

        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                error: "STUDENT_NOT_FOUND"
            });
        }

        if (student.role !== "student") {
            return res.status(400).json({
                message: "Invalid role",
                error: "INVALID_ROLE"
            });
        }

        if (student.roomId) {
            return res.status(400).json({
                message: "Student already has a room",
                error: "STUDENT_ALREADY_ALLOCATED"
            });
        }

        const room = await Room.findOne({
            isActive: true,
            $expr: { $lt: ["$occupiedCount", "$capacity"] }
        }).sort({ block: 1, roomNumber: 1 });

        if (!room) {
            return res.status(404).json({
                message: "No rooms available",
                error: "NO_ROOMS_AVAILABLE"
            });
        }

        student.roomId = room._id;
        await student.save();

        room.students.push(student._id);
        room.occupiedCount += 1;
        await room.save();

        const updatedRoom = await Room.findById(room._id)
            .populate("students", "fullName studentId email phone");

        res.status(200).json({
            message: "Room auto-allocated successfully",
            data: {
                student: {
                    id: student._id,
                    name: student.fullName,
                    studentId: student.studentId,
                    roomId: room._id
                },
                room: updatedRoom
            }
        });

    } catch (err) {
        console.error("AUTO ALLOCATE ERROR:", err);
        res.status(500).json({
            message: "Error auto-allocating room",
            error: err.message
        });
    }
});


router.put("/deallocate/:studentId", async (req, res) => {
    try {
        const { studentId } = req.params;

        
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                error: "STUDENT_NOT_FOUND"
            });
        }

        
        if (!student.roomId) {
            return res.status(400).json({
                message: "Student is not allocated to any room",
                error: "NO_ROOM_ALLOCATED"
            });
        }

        
        const room = await Room.findById(student.roomId);
        if (!room) {
            return res.status(404).json({
                message: "Room not found",
                error: "ROOM_NOT_FOUND"
            });
        }

        
        room.students = room.students.filter(id => id.toString() !== studentId);
        room.occupiedCount = Math.max(0, room.occupiedCount - 1);
        await room.save();

        
        const previousRoomId = student.roomId;
        student.roomId = null;
        await student.save();

        res.json({
            message: "Room deallocated successfully",
            data: {
                student: {
                    id: student._id,
                    name: student.fullName,
                    studentId: student.studentId
                },
                previousRoom: {
                    roomId: previousRoomId,
                    roomNumber: room.roomNumber,
                    block: room.block,
                    newOccupiedCount: room.occupiedCount
                }
            }
        });

    } catch (err) {
        console.error("DEALLOCATE ROOM ERROR:", err);
        res.status(500).json({
            message: "Error deallocating room",
            error: err.message
        });
    }
});


router.get("/student/:studentId", async (req, res) => {
    try {
        const { studentId } = req.params;

        
        const student = await User.findById(studentId).populate("roomId");

        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                error: "STUDENT_NOT_FOUND"
            });
        }

        if (!student.roomId) {
            return res.status(404).json({
                message: "Student is not allocated to any room",
                error: "NO_ROOM_ALLOCATED",
                student: {
                    id: student._id,
                    name: student.fullName,
                    studentId: student.studentId
                }
            });
        }

        
        const room = await Room.findById(student.roomId)
            .populate("students", "fullName studentId email phone");

        res.json({
            message: "Student room details retrieved",
            data: {
                student: {
                    id: student._id,
                    name: student.fullName,
                    studentId: student.studentId,
                    email: student.email
                },
                room: room
            }
        });

    } catch (err) {
        console.error("FETCH STUDENT ROOM ERROR:", err);
        res.status(500).json({
            message: "Error fetching student room",
            error: err.message
        });
    }
});


router.get("/available/list", async (req, res) => {
    try {
        
        const availableRooms = await Room.find({
            isActive: true,
            $expr: { $lt: ["$occupiedCount", "$capacity"] }
        })
            .populate("students", "fullName studentId")
            .sort({ block: 1, roomNumber: 1 });

        res.json({
            message: "Available rooms retrieved",
            count: availableRooms.length,
            data: availableRooms
        });

    } catch (err) {
        console.error("FETCH AVAILABLE ROOMS ERROR:", err);
        res.status(500).json({
            message: "Error fetching available rooms",
            error: err.message
        });
    }
});


router.get("/stats/overview", async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments({ isActive: true });
        const fullRooms = await Room.countDocuments({ 
            isActive: true,
            $expr: { $gte: ["$occupiedCount", "$capacity"] }
        });
        const availableRooms = totalRooms - fullRooms;

        const rooms = await Room.find({ isActive: true });
        let totalCapacity = 0;
        let totalOccupied = 0;

        rooms.forEach(room => {
            totalCapacity += room.capacity;
            totalOccupied += room.occupiedCount;
        });

        const occupancyRate = totalCapacity > 0 
            ? ((totalOccupied / totalCapacity) * 100).toFixed(2)
            : 0;

        res.json({
            message: "Room statistics retrieved",
            stats: {
                totalRooms,
                fullRooms,
                availableRooms,
                totalCapacity,
                totalOccupied,
                occupancyRate: `${occupancyRate}%`
            }
        });

    } catch (err) {
        console.error("STATS ERROR:", err);
        res.status(500).json({
            message: "Error fetching statistics",
            error: err.message
        });
    }
});


router.put("/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;
        const { capacity, amenities, description, isActive } = req.body;

        
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                message: "Room not found",
                error: "ROOM_NOT_FOUND"
            });
        }

        
        if (capacity) {
            if (capacity < 1 || capacity > 10) {
                return res.status(400).json({
                    message: "Capacity must be between 1 and 10",
                    error: "INVALID_CAPACITY"
                });
            }
            
            if (capacity < room.occupiedCount) {
                return res.status(400).json({
                    message: `Cannot reduce capacity below current occupancy (${room.occupiedCount})`,
                    error: "INVALID_CAPACITY_REDUCTION"
                });
            }
            room.capacity = capacity;
        }

        if (amenities) {
            room.amenities = amenities;
        }

        if (description !== undefined) {
            room.description = description;
        }

        if (isActive !== undefined) {
            room.isActive = isActive;
        }

        const updatedRoom = await room.save();

        res.json({
            message: "Room updated successfully",
            data: updatedRoom
        });

    } catch (err) {
        console.error("UPDATE ROOM ERROR:", err);
        res.status(500).json({
            message: "Error updating room",
            error: err.message
        });
    }
});


router.delete("/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;

        
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                message: "Room not found",
                error: "ROOM_NOT_FOUND"
            });
        }

        
        if (room.occupiedCount > 0) {
            return res.status(400).json({
                message: `Cannot delete room with ${room.occupiedCount} students. Deallocate all students first.`,
                error: "ROOM_NOT_EMPTY",
                occupiedCount: room.occupiedCount
            });
        }

        
        await Room.findByIdAndDelete(roomId);

        res.json({
            message: "Room deleted successfully",
            data: {
                roomNumber: room.roomNumber,
                block: room.block
            }
        });

    } catch (err) {
        console.error("DELETE ROOM ERROR:", err);
        res.status(500).json({
            message: "Error deleting room",
            error: err.message
        });
    }
});

module.exports = router;
