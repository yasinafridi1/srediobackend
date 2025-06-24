import Joi from "joi";

const emailSchema = Joi.string()
  .email({ tlds: { allow: true } }) // Disable strict TLD validation
  .required()
  .messages({
    "string.email": "Please enter a valid email address.",
    "string.empty": "Email is required.",
    "any.required": "Email is required.",
  });

const passwordSchema = Joi.string()
  .pattern(
    new RegExp(
      "^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,15}$"
    )
  )
  .required()
  .messages({
    "string.pattern.base":
      "Password must include at least 1 uppercase letter, 1 number, 1 special character, and be 8-15 characters long",
  });

const fullNameSchema = Joi.string().required().max(70);

export const loginSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  subscription: Joi.any().optional(),
});

export const registerSchema = Joi.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .label("Confirm password")
    .messages({
      "any.only": "{{#label}} does not match password",
    }),
});
