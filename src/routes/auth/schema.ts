import {z} from "zod"
export const loginSchema = z.object({
    email: z.string().min(1, {message: ("email is required")}).email("Invalid email"),
    password: z.string().min(2, {message:("password too short")})
  });

export const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(2, {message:("password too short")}),
  confirmPassword: z.string(),
  name: z.string().min(2, {message:("name is required")}),
  number: z.string().min(5, {message:("number is required")}),
  type:z.enum(["Business", "Individual"])
}).superRefine(({password, confirmPassword}, ctx)=>{
  if (confirmPassword!=password)
  {
    ctx.addIssue({code:"custom", message:"Password does not match", path:["confirmPassword"]});
  }
});
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(2, {message:("password too short")}),
  confirmPassword: z.string()
})

 export const correspondenceSchema= z.object({
  name:z.string().min(2, {message:("name is required")}),
  state:z.string(),
  address:z.string(),
  email:z.string().email("Invalid email"),
  phone:z.number({message:("Invalid Nigerian number")}).min(10).max(10),
});
  export type LoginSchema = typeof loginSchema;
  export type SignUpSchema = typeof signupSchema;
  export type ForgotPasswordSchema = typeof forgotPasswordSchema;
  export type ResetPasswordSchema = typeof resetPasswordSchema;
  export type CorrespondenceSchema = typeof correspondenceSchema;