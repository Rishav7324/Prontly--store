'use server';
/**
 * @fileOverview AI flow to generate high-converting product descriptions.
 *
 * - generateProductCopy - A function that creates product descriptions using AI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductCopyInputSchema = z.object({
  name: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product.'),
  features: z.string().describe('Key features or keywords for the product.'),
  tone: z.enum(['professional', 'persuasive', 'playful']).default('persuasive'),
});
export type ProductCopyInput = z.infer<typeof ProductCopyInputSchema>;

const ProductCopyOutputSchema = z.object({
  description: z.string().describe('A HTML formatted high-converting product description.'),
  shortDescription: z.string().describe('A punchy one-sentence summary.'),
  seoKeywords: z.array(z.string()).describe('Target keywords for search engines.'),
});
export type ProductCopyOutput = z.infer<typeof ProductCopyOutputSchema>;

export async function generateProductCopy(input: ProductCopyInput): Promise<ProductCopyOutput> {
  return generateProductCopyFlow(input);
}

const productCopyPrompt = ai.definePrompt({
  name: 'productCopyPrompt',
  input: {schema: ProductCopyInputSchema},
  output: {schema: ProductCopyOutputSchema},
  prompt: `You are an expert e-commerce copywriter. Create a compelling, professional, and SEO-optimized product description for a digital asset.

Product: {{{name}}}
Category: {{{category}}}
Key Features: {{{features}}}
Tone: {{{tone}}}

Your description should:
1. Use HTML tags (e.g., <p>, <ul>, <li>, <strong>) for formatting.
2. Focus on benefits, not just features.
3. Include a "What's Included" section.
4. Be persuasive and professional.

Return a punchy shortDescription and a list of target SEO keywords based on the product type.`,
});

const generateProductCopyFlow = ai.defineFlow(
  {
    name: 'generateProductCopyFlow',
    inputSchema: ProductCopyInputSchema,
    outputSchema: ProductCopyOutputSchema,
  },
  async (input) => {
    const {output} = await productCopyPrompt(input);
    if (!output) throw new Error('AI generation failed.');
    return output;
  }
);
