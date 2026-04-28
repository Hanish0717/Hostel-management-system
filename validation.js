

const validator = require("validator");


function validateEmail(email) {
    if (!email) {
        return { isValid: false, error: "Email is required" };
    }

    email = email.trim().toLowerCase();

    
    if (!validator.isEmail(email)) {
        return { isValid: false, error: "Invalid email format" };
    }

    // Accept any email format for students
    return { isValid: true, error: null };
}


function validatePassword(password) {
    const errors = [];
    let strengthScore = 0;

    if (!password) {
        return { 
            isValid: false, 
            errors: ["Password is required"],
            strength: 'weak'
        };
    }

    
    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    } else {
        strengthScore++;
        if (password.length >= 12) strengthScore++;
        if (password.length >= 16) strengthScore++;
    }

    
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least 1 uppercase letter (A-Z)");
    } else {
        strengthScore++;
    }

    
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least 1 lowercase letter (a-z)");
    } else {
        strengthScore++;
    }

    
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least 1 number (0-9)");
    } else {
        strengthScore++;
    }

    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push("Password must contain at least 1 special character (!@#$%^&*, etc.)");
    } else {
        strengthScore++;
    }

    
    let strength = 'weak';
    if (strengthScore >= 5) strength = 'excellent';
    else if (strengthScore >= 4) strength = 'strong';
    else if (strengthScore >= 2) strength = 'medium';

    return {
        isValid: errors.length === 0,
        errors: errors,
        strength: strength,
        strengthScore: strengthScore
    };
}


function validatePhone(phone) {
    if (!phone) {
        return { isValid: false, error: "Phone number is required" };
    }

    phone = phone.toString().trim();

    
    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    
    if (!/^\d+$/.test(cleanPhone)) {
        return { isValid: false, error: "Phone number must contain only digits" };
    }

    
    if (cleanPhone.length !== 10) {
        return { isValid: false, error: "Phone number must be exactly 10 digits" };
    }

    return { isValid: true, error: null, cleanPhone };
}


function validateFullName(fullName) {
    if (!fullName) {
        return { isValid: false, error: "Full name is required" };
    }

    fullName = fullName.trim();

    
    if (fullName.length < 3) {
        return { isValid: false, error: "Full name must be at least 3 characters long" };
    }

    
    if (fullName.length > 50) {
        return { isValid: false, error: "Full name must not exceed 50 characters" };
    }

    
    if (!/^[a-zA-Z\s'-]+$/.test(fullName)) {
        return { isValid: false, error: "Full name can only contain letters, spaces, hyphens, and apostrophes" };
    }

    return { isValid: true, error: null };
}


function validateStudentId(studentId) {
    if (!studentId) {
        return { isValid: false, error: "Student ID is required" };
    }

    studentId = studentId.trim().toUpperCase();

    
    // Accept 10 alphanumeric characters (e.g., 24345A4210)
    if (!/^[A-Z0-9]{10}$/.test(studentId)) {
        return { isValid: false, error: "Student ID must be 10 alphanumeric characters (e.g., 24345A4210)" };
    }

    return { isValid: true, error: null };
}


function validateRoomNumber(roomNumber) {
    if (!roomNumber) {
        return { isValid: false, error: "Room number is required" };
    }

    roomNumber = roomNumber.trim().toUpperCase();

    
    if (!/^[A-Z]\d{2,4}$/.test(roomNumber)) {
        return { isValid: false, error: "Room number must be in format: A101, B205, etc." };
    }

    return { isValid: true, error: null };
}


function validateRegistrationData(data) {
    const errors = {};
    const role = data.role || "student";

    const nameValidation = validateFullName(data.fullName);
    if (!nameValidation.isValid) {
        errors.fullName = nameValidation.error;
    }

    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
        errors.email = emailValidation.error;
    }

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors;
    }

    if (role === "student" || role === "warden") {
        const phoneValidation = validatePhone(data.phone);
        if (!phoneValidation.isValid) {
            errors.phone = phoneValidation.error;
        }
    } else if (data.phone) {
        // Admin optional phone validation
        const phoneValidation = validatePhone(data.phone);
        if (!phoneValidation.isValid) {
            errors.phone = phoneValidation.error;
        }
    }

    if (role === "student") {
        const studentIdValidation = validateStudentId(data.studentId);
        if (!studentIdValidation.isValid) {
            errors.studentId = studentIdValidation.error;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors,
        passwordStrength: passwordValidation.strength
    };
}


function validateLoginData(data) {
    const errors = {};

    
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
        errors.email = emailValidation.error;
    }

    
    if (!data.password) {
        errors.password = "Password is required";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
    };
}


function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .trim()
        .replace(/[<>\"']/g, '')
        .substring(0, 500); 
}

module.exports = {
    validateEmail,
    validatePassword,
    validatePhone,
    validateFullName,
    validateStudentId,
    validateRoomNumber,
    validateRegistrationData,
    validateLoginData,
    sanitizeInput
};
