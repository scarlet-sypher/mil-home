import { describe, it, expect } from "vitest";
import { signupSchema, passwordSchema } from "./validators";

describe("passwordSchema", () => {
  it("rejects a password shorter than 10 characters", () => {
    expect(passwordSchema.safeParse("Abc123!").success).toBe(false);
  });

  it("rejects a password with no symbol", () => {
    expect(passwordSchema.safeParse("Abcdefgh12").success).toBe(false);
  });

  it("rejects a password with no uppercase letter", () => {
    expect(passwordSchema.safeParse("abcdefgh1!").success).toBe(false);
  });

  it("accepts a password meeting every rule", () => {
    expect(passwordSchema.safeParse("Abcdefgh1!").success).toBe(true);
  });
});

describe("signupSchema", () => {
  it("lowercases and trims the email", () => {
    const result = signupSchema.safeParse({
      email: "  User@Example.com  ",
      username: "testuser",
      password: "Abcdefgh1!",
      confirmPassword: "Abcdefgh1!",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects when confirmPassword does not match", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      username: "testuser",
      password: "Abcdefgh1!",
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
  });
});
