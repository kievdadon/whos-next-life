import { z } from 'zod';

// Driver Application Validation Schema
export const driverApplicationSchema = z.object({
  firstName: z.string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(50, { message: "First name must be less than 50 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "First name can only contain letters, spaces, hyphens, and apostrophes" }),
  
  lastName: z.string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(50, { message: "Last name must be less than 50 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Last name can only contain letters, spaces, hyphens, and apostrophes" }),
  
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  
  phone: z.string()
    .trim()
    .regex(/^\+?[\d\s\-\(\)]{10,15}$/, { message: "Invalid phone number format" }),
  
  address: z.string()
    .trim()
    .min(5, { message: "Address is required and must be at least 5 characters" })
    .max(200, { message: "Address must be less than 200 characters" }),
  
  city: z.string()
    .trim()
    .min(1, { message: "City is required" })
    .max(100, { message: "City must be less than 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "City can only contain letters, spaces, hyphens, and apostrophes" }),
  
  state: z.string()
    .trim()
    .min(2, { message: "State is required" })
    .max(50, { message: "State must be less than 50 characters" }),
  
  zipCode: z.string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, { message: "Invalid ZIP code format" }),
  
  dateOfBirth: z.string()
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 100;
    }, { message: "Must be at least 18 years old" }),
  
  vehicleType: z.string()
    .trim()
    .min(1, { message: "Vehicle type is required" })
    .max(50, { message: "Vehicle type must be less than 50 characters" }),
  
  vehicleMake: z.string()
    .trim()
    .min(1, { message: "Vehicle make is required" })
    .max(50, { message: "Vehicle make must be less than 50 characters" }),
  
  vehicleModel: z.string()
    .trim()
    .min(1, { message: "Vehicle model is required" })
    .max(50, { message: "Vehicle model must be less than 50 characters" }),
  
  vehicleYear: z.string()
    .trim()
    .regex(/^\d{4}$/, { message: "Invalid year format" })
    .refine((year) => {
      const yearNum = parseInt(year);
      const currentYear = new Date().getFullYear();
      return yearNum >= 1990 && yearNum <= currentYear + 1;
    }, { message: "Vehicle year must be between 1990 and current year" }),
  
  licensePlate: z.string()
    .trim()
    .min(1, { message: "License plate is required" })
    .max(20, { message: "License plate must be less than 20 characters" })
    .regex(/^[A-Za-z0-9\s-]+$/, { message: "Invalid license plate format" }),
  
  insuranceProvider: z.string()
    .trim()
    .min(1, { message: "Insurance provider is required" })
    .max(100, { message: "Insurance provider must be less than 100 characters" }),
  
  emergencyContact: z.string()
    .trim()
    .min(1, { message: "Emergency contact name is required" })
    .max(100, { message: "Emergency contact name must be less than 100 characters" }),
  
  emergencyPhone: z.string()
    .trim()
    .regex(/^\+?[\d\s\-\(\)]{10,15}$/, { message: "Invalid emergency phone number format" }),
  
  experience: z.string()
    .trim()
    .max(1000, { message: "Experience description must be less than 1000 characters" }),
  
  agreedToTerms: z.boolean()
    .refine((val) => val === true, { message: "You must agree to the terms and conditions" })
});

// Business Registration Validation Schema
export const businessRegistrationSchema = z.object({
  businessName: z.string()
    .trim()
    .min(1, { message: "Business name is required" })
    .max(100, { message: "Business name must be less than 100 characters" }),
  
  businessType: z.string()
    .trim()
    .min(1, { message: "Business type is required" }),
  
  description: z.string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(2000, { message: "Description must be less than 2000 characters" }),
  
  contactEmail: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  
  contactPhone: z.string()
    .trim()
    .regex(/^\+?[\d\s\-\(\)]{10,15}$/, { message: "Invalid phone number format" }),
  
  address: z.string()
    .trim()
    .min(5, { message: "Address is required and must be at least 5 characters" })
    .max(200, { message: "Address must be less than 200 characters" }),
  
  ownerName: z.string()
    .trim()
    .min(1, { message: "Owner/Manager name is required" })
    .max(100, { message: "Name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Name can only contain letters, spaces, hyphens, and apostrophes" }),
  
  website: z.string()
    .trim()
    .url({ message: "Invalid website URL" })
    .optional()
    .or(z.literal('')),
  
  businessLicense: z.string()
    .trim()
    .max(50, { message: "Business license must be less than 50 characters" })
    .optional()
});

// File Upload Validation
export const validateFileUpload = (file: File, maxSizeBytes: number = 5 * 1024 * 1024) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed. Please upload JPG, PNG, WEBP, or PDF files only.' };
  }
  
  if (file.size > maxSizeBytes) {
    return { isValid: false, error: `File size too large. Maximum size is ${Math.round(maxSizeBytes / 1024 / 1024)}MB.` };
  }
  
  // Basic filename validation
  if (file.name.length > 255) {
    return { isValid: false, error: 'Filename too long. Maximum 255 characters.' };
  }
  
  return { isValid: true, error: null };
};

// Input sanitization for display
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove potential JS injection
    .replace(/on\w+=/gi, ''); // Remove potential event handlers
};

export type DriverApplicationData = z.infer<typeof driverApplicationSchema>;
export type BusinessRegistrationData = z.infer<typeof businessRegistrationSchema>;