'use server';
/**
 * @fileOverview AI flow to generate professional product images.
 *
 * - generateProductImage - A function that creates product visuals using AI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductImageInputSchema = z.object({
  prompt: z.string().describe('The description of the image to generate.'),
  aspectRatio: z.enum(['1:1', '4:5', '16:9']).default('4:5'),
});
export type ProductImageInput = z.infer<typeof ProductImageInputSchema>;

const ProductImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type ProductImageOutput = z.infer<typeof ProductImageOutputSchema>;

/**
 * Generates a high-quality product image using Imagen 4.
 */
export async function generateProductImage(input: ProductImageInput): Promise<ProductImageOutput> {
  return generateProductImageFlow(input);
}

const generateProductImageFlow = ai.defineFlow(
  {
    name: 'generateProductImageFlow',
    inputSchema: ProductImageInputSchema,
    outputSchema: ProductImageOutputSchema,
  },
  async (input) => {
    // Enhance the user's prompt for better product photography results
    const enhancedPrompt = `Professional commercial product photography of ${input.prompt}. 
    High-end studio lighting, clean minimal background, 8k resolution, highly detailed, 
    masterpiece, premium quality.`;

    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: enhancedPrompt,
    });

    if (!media || !media.url) {
      throw new Error('AI image generation failed to return media.');
    }

    return {
      imageUrl: media.url,
    };
  }
);
