import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address").pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});

export const signUpSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address").pipe(z.email("Enter a valid email address")),
  password: z.string().min(8, "Use at least 8 characters"),
});

export const codeSchema = z.object({
  code: z.string().trim().min(6, "Enter the 6-digit code").max(6, "Enter the 6-digit code"),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type CodeValues = z.infer<typeof codeSchema>;
