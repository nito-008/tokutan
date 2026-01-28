import { safeParse } from "valibot";
import { describe, expect, it } from "vitest";
import { GradeSchema } from "../enrollment/grade";
import { UserProfileSchema } from "../enrollment/user-profile";
import { GraduationRequirementsSchema } from "../requirements/graduation";

describe("Valibot Schema Validation", () => {
  describe("GraduationRequirementsSchema", () => {
    it("should validate a valid graduation requirements object", () => {
      const validData = {
        id: "req-001",
        year: 2024,
        department: "情報科学類",
        major: "ソフトウェアサイエンス",
        totalCredits: 120,
        categories: [],
        version: "1.0.0",
        isDefault: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = safeParse(GraduationRequirementsSchema, validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid year", () => {
      const invalidData = {
        id: "req-001",
        year: 1800, // Too old
        department: "情報科学類",
        totalCredits: 120,
        categories: [],
        version: "1.0.0",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = safeParse(GraduationRequirementsSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid datetime format", () => {
      const invalidData = {
        id: "req-001",
        year: 2024,
        department: "情報科学類",
        totalCredits: 120,
        categories: [],
        version: "1.0.0",
        createdAt: "invalid-date",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = safeParse(GraduationRequirementsSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("UserProfileSchema", () => {
    it("should validate a valid user profile", () => {
      const validData = {
        id: "user-001",
        name: "テストユーザー",
        studentId: "202312345",
        enrollmentYear: 2023,
        department: "情報科学類",
        selectedRequirementsId: "req-001",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = safeParse(UserProfileSchema, validData);
      expect(result.success).toBe(true);
    });

    it("should allow optional fields to be omitted", () => {
      const validData = {
        id: "user-001",
        name: "テストユーザー",
        enrollmentYear: 2023,
        department: "情報科学類",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = safeParse(UserProfileSchema, validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const invalidData = {
        id: "user-001",
        name: "",
        enrollmentYear: 2023,
        department: "情報科学類",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = safeParse(UserProfileSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("GradeSchema", () => {
    it("should validate valid grades", () => {
      const validGrades = ["A+", "A", "B", "C", "D", "P", "認", "履修中", "-"];

      for (const grade of validGrades) {
        const result = safeParse(GradeSchema, grade);
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid grades", () => {
      const invalidGrades = ["E", "F", "X", "123", ""];

      for (const grade of invalidGrades) {
        const result = safeParse(GradeSchema, grade);
        expect(result.success).toBe(false);
      }
    });
  });
});
