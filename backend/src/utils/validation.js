import Joi from 'joi';

export const generateImagesSchema = Joi.object({
  text: Joi.string().required().min(3).max(500),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
  size: Joi.string().valid('S', 'M', 'L', 'custom'),
  style: Joi.string().valid('sci-fi', 'low-poly', 'realistic', 'playful', 'retro'),
  material: Joi.string(),
  production: Joi.string().valid('handmade', 'digital'),
  details: Joi.array().items(Joi.string()),
  //user_id: Joi.string().required(),
  creation_id: Joi.string().required(),
  customWidth: Joi.when('size', {
    is: 'custom',
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  }),
  customHeight: Joi.when('size', {
    is: 'custom',
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  })
});

export const generate3DSchema = Joi.object({
  image_url: Joi.string().uri().required(),
  session_id: Joi.string(),
  //user_id: Joi.string().required(),
  creation_id: Joi.string().required(),
  options: Joi.object({
    seed: Joi.number().integer(),
    texture_size: Joi.number().valid(512, 1024, 2048, 4096),
    mesh_simplify: Joi.number().min(0).max(1),
    generate_color: Joi.boolean(),
    generate_model: Joi.boolean(),
    randomize_seed: Joi.boolean(),
    generate_normal: Joi.boolean(),
    save_gaussian_ply: Joi.boolean(),
    ss_sampling_steps: Joi.number().integer().min(1).max(100),
    slat_sampling_steps: Joi.number().integer().min(1).max(50),
    return_no_background: Joi.boolean(),
    ss_guidance_strength: Joi.number().min(0).max(20),
    slat_guidance_strength: Joi.number().min(0).max(10)
  }).optional()
});

export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().max(50),
  lastName: Joi.string().max(50)
});

// Stripe Payment Validation Schemas
export const createCustomerSchema = Joi.object({
  userId: Joi.string().required(),
  email: Joi.string().email().required(),
  name: Joi.string().max(100),
  metadata: Joi.object().optional()
});

export const createPaymentIntentSchema = Joi.object({
  userId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  metadata: Joi.object().optional()
});

export const createSubscriptionSchema = Joi.object({
  userId: Joi.string().required(),
  priceId: Joi.string().required(),
  metadata: Joi.object().optional()
});

export const trackUsageSchema = Joi.object({
  type: Joi.string().valid('image', 'model').required(),
  amount: Joi.number().integer().min(1).default(1)
});

export const createRefundSchema = Joi.object({
  paymentIntentId: Joi.string().required(),
  amount: Joi.number().positive().optional(),
  reason: Joi.string().valid('duplicate', 'fraudulent', 'requested_by_customer').default('requested_by_customer')
});

// Checkout Validation Schemas
export const createCheckoutSchema = Joi.object({
  userId: Joi.string().required(),
  designId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).default(1)
});

export const updateShippingSchema = Joi.object({
  firstName: Joi.string().required().max(50),
  lastName: Joi.string().required().max(50),
  email: Joi.string().email().required(),
  phone: Joi.string().required().max(20),
  address: Joi.object({
    line1: Joi.string().required().max(100),
    line2: Joi.string().max(100).optional(),
    city: Joi.string().required().max(50),
    state: Joi.string().required().max(50),
    postalCode: Joi.string().required().max(20),
    country: Joi.string().required().max(50)
  }).required(),
  method: Joi.string().valid('standard', 'express', 'overnight').default('standard')
});

export const updateBillingSchema = Joi.object({
  firstName: Joi.string().required().max(50),
  lastName: Joi.string().required().max(50),
  email: Joi.string().email().required(),
  address: Joi.object({
    line1: Joi.string().required().max(100),
    line2: Joi.string().max(100).optional(),
    city: Joi.string().required().max(50),
    state: Joi.string().required().max(50),
    postalCode: Joi.string().required().max(20),
    country: Joi.string().required().max(50)
  }).required(),
  sameAsShipping: Joi.boolean().default(true)
});

export const completeCheckoutSchema = Joi.object({
  paymentIntentId: Joi.string().required()
});