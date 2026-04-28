const express = require("express");
const router = express.Router();
const FoodToken = require("../models/FoodToken");
const User = require("../models/User");




function generateTokenId() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `FT${randomNum}`;
}


function calculateExpirationTime(mealType) {
    const now = new Date();
    const expiresAt = new Date(now);

    switch (mealType) {
        case "breakfast":
            
            expiresAt.setHours(8, 30, 0, 0);
            if (expiresAt < now) expiresAt.setDate(expiresAt.getDate() + 1);
            break;
        case "lunch":
            
            expiresAt.setHours(13, 30, 0, 0);
            if (expiresAt < now) expiresAt.setDate(expiresAt.getDate() + 1);
            break;
        case "dinner":
            
            expiresAt.setHours(20, 30, 0, 0);
            if (expiresAt < now) expiresAt.setDate(expiresAt.getDate() + 1);
            break;
    }

    return expiresAt;
}


function isTokenExpired(expiresAt) {
    return new Date() > expiresAt;
}


function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}


router.post("/generate", async (req, res) => {
    try {
        const { studentId, mealType } = req.body;

        
        if (!studentId || !mealType) {
            return res.status(400).json({
                message: "studentId and mealType are required",
                error: "MISSING_FIELDS"
            });
        }

        
        if (!["breakfast", "lunch", "dinner"].includes(mealType)) {
            return res.status(400).json({
                message: "mealType must be breakfast, lunch, or dinner",
                error: "INVALID_MEAL_TYPE"
            });
        }

        
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                error: "STUDENT_NOT_FOUND"
            });
        }

        
        const today = getTodayDate();
        const existingToken = await FoodToken.findOne({
            studentId,
            mealType,
            date: today
        });

        if (existingToken) {
            
            return res.status(200).json({
                message: "Token already exists for today",
                data: existingToken,
                isNew: false
            });
        }

        
        const expiresAt = calculateExpirationTime(mealType);

        
        let tokenId;
        let isUnique = false;
        while (!isUnique) {
            tokenId = generateTokenId();
            const existing = await FoodToken.findOne({ tokenId });
            if (!existing) isUnique = true;
        }

        
        const newToken = new FoodToken({
            studentId,
            mealType,
            date: today,
            tokenId,
            expiresAt,
            status: "valid"
        });

        const savedToken = await newToken.save();

        res.status(201).json({
            message: "Token generated successfully",
            data: savedToken,
            isNew: true
        });

    } catch (err) {
        console.error("TOKEN GENERATION ERROR:", err);
        res.status(500).json({
            message: "Error generating token",
            error: err.message
        });
    }
});


router.get("/today/:studentId", async (req, res) => {
    try {
        const { studentId } = req.params;

        
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                error: "STUDENT_NOT_FOUND"
            });
        }

        
        const today = getTodayDate();
        const tokens = await FoodToken.find({
            studentId,
            date: today
        }).sort({ mealType: 1 });

        
        const updatedTokens = tokens.map(token => {
            if (token.status === "valid" && isTokenExpired(token.expiresAt)) {
                token.status = "expired";
            }
            return token;
        });

        res.json({
            message: "Today's tokens retrieved",
            date: today,
            count: updatedTokens.length,
            data: updatedTokens
        });

    } catch (err) {
        console.error("FETCH TODAY TOKENS ERROR:", err);
        res.status(500).json({
            message: "Error fetching tokens",
            error: err.message
        });
    }
});


router.put("/use", async (req, res) => {
    try {
        const { tokenId } = req.body;

        
        if (!tokenId) {
            return res.status(400).json({
                message: "tokenId is required",
                error: "MISSING_TOKEN_ID"
            });
        }

        
        const token = await FoodToken.findOne({ tokenId });
        if (!token) {
            return res.status(404).json({
                message: "Token not found",
                error: "TOKEN_NOT_FOUND"
            });
        }

        
        if (token.status === "used") {
            return res.status(400).json({
                message: "Token has already been used",
                error: "TOKEN_ALREADY_USED"
            });
        }

        
        if (isTokenExpired(token.expiresAt)) {
            
            token.status = "expired";
            await token.save();
            return res.status(400).json({
                message: "Token has expired",
                error: "TOKEN_EXPIRED"
            });
        }

        
        token.status = "used";
        token.usedAt = new Date();
        const updatedToken = await token.save();

        res.json({
            message: "Token marked as used successfully",
            data: updatedToken
        });

    } catch (err) {
        console.error("USE TOKEN ERROR:", err);
        res.status(500).json({
            message: "Error marking token as used",
            error: err.message
        });
    }
});


router.get("/verify/:tokenId", async (req, res) => {
    try {
        const { tokenId } = req.params;

        
        const token = await FoodToken.findOne({ tokenId }).populate("studentId", "fullName studentId room");

        if (!token) {
            return res.status(404).json({
                message: "Token not found",
                error: "TOKEN_NOT_FOUND",
                valid: false
            });
        }

        
        let status = token.status;
        if (status === "valid" && isTokenExpired(token.expiresAt)) {
            status = "expired";
        }

        
        const response = {
            tokenId: token.tokenId,
            studentId: token.studentId._id,
            studentName: token.studentId.fullName,
            studentIdNum: token.studentId.studentId,
            mealType: token.mealType,
            date: token.date,
            status: status,
            generatedAt: token.generatedAt,
            expiresAt: token.expiresAt,
            usedAt: token.usedAt
        };

        
        const isValid = status === "valid" && !isTokenExpired(token.expiresAt);

        res.json({
            message: "Token verified",
            valid: isValid,
            data: response
        });

    } catch (err) {
        console.error("VERIFY TOKEN ERROR:", err);
        res.status(500).json({
            message: "Error verifying token",
            error: err.message
        });
    }
});


router.get("/student/:studentId", async (req, res) => {
    try {
        const { studentId } = req.params;

        
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                error: "STUDENT_NOT_FOUND"
            });
        }

        
        const tokens = await FoodToken.find({ studentId })
            .sort({ date: -1, mealType: 1 })
            .limit(30); 

        res.json({
            message: "Student tokens retrieved",
            studentName: student.fullName,
            count: tokens.length,
            data: tokens
        });

    } catch (err) {
        console.error("FETCH STUDENT TOKENS ERROR:", err);
        res.status(500).json({
            message: "Error fetching student tokens",
            error: err.message
        });
    }
});


router.get("/admin/all", async (req, res) => {
    try {
        const { date, mealType, status } = req.query;

        
        let filter = {};

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        if (mealType) {
            filter.mealType = mealType;
        }

        if (status) {
            filter.status = status;
        }

        
        const tokens = await FoodToken.find(filter)
            .populate("studentId", "fullName studentId room email")
            .sort({ date: -1, mealType: 1 })
            .limit(100);

        
        const stats = {
            total: tokens.length,
            valid: tokens.filter(t => t.status === "valid").length,
            used: tokens.filter(t => t.status === "used").length,
            expired: tokens.filter(t => t.status === "expired").length
        };

        res.json({
            message: "Admin tokens retrieved",
            stats,
            data: tokens
        });

    } catch (err) {
        console.error("ADMIN FETCH TOKENS ERROR:", err);
        res.status(500).json({
            message: "Error fetching admin tokens",
            error: err.message
        });
    }
});


router.delete("/cancel/:tokenId", async (req, res) => {
    try {
        const { tokenId } = req.params;

        
        const token = await FoodToken.findOneAndDelete({ tokenId });

        if (!token) {
            return res.status(404).json({
                message: "Token not found",
                error: "TOKEN_NOT_FOUND"
            });
        }

        res.json({
            message: "Token cancelled successfully",
            data: token
        });

    } catch (err) {
        console.error("CANCEL TOKEN ERROR:", err);
        res.status(500).json({
            message: "Error cancelling token",
            error: err.message
        });
    }
});

module.exports = router;
