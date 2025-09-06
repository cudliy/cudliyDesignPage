import Joi from 'joi';

export const generateImagesSchema = Joi.object({
  text: Joi.string().required().min(3).max(500),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
  size: Joi.string().valid('S', 'M', 'L', 'custom'),
  style: Joi.string().valid('sci-fi', 'low-poly', 'realistic', 'playful', 'retro'),
  material: Joi.string(),
  production: Joi.string().valid('handmade', 'digital'),
  details: Joi.array().items(Joi.string()),
  user_id: Joi.string().required(),
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
  user_id: Joi.string().required(),
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
