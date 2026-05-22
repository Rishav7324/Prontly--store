'use server';
/**
 * @fileOverview AI agent to assist with blog content creation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BlogAssistantInputSchema = z.object({
  topic: z.string().describe('The main topic or title of the blog post.'),
  targetAudience: z.string().optional().describe('Who is this article for?'),
  tone: z.enum(['educational', 'hype', 'controversial', 'professional']).default('educational'),
});

const BlogAssistantOutputSchema = z.object({
  outline: z.array(z.string()).describe('A hierarchical outline of the article.'),
  introduction: z.string().describe('A high-converting introductory paragraph.'),
  contentDraft: z.string().describe('A structured HTML draft of the first few sections.'),
  seoSuggestions: z.object({
    metaTitle: z.string(),
    metaDescription: z.string(),
    tags: z.array(z.string()),
  }),
});

export async function generateBlogDraft(input: z.infer<typeof BlogAssistantInputSchema>) {
  return blogAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'blogAssistantPrompt',
  input: {schema: BlogAssistantInputSchema},
  output: {schema: BlogAssistantOutputSchema},
  prompt: `You are an expert content strategist for a digital assets marketplace. 
Help the user write a blog post about: {{{topic}}}.

Target Audience: {{#if targetAudience}}{{{targetAudience}}}{{else}}Digital creators and developers{{/if}}
Tone: {{{tone}}}

Your goal is to provide a structured starting point for a professional blog article.
The contentDraft should use HTML tags (h2, p, strong) and be ready for a rich text editor.`,
});

const blogAssistantFlow = ai.defineFlow(
  {
    name: 'blogAssistantFlow',
    inputSchema: BlogAssistantInputSchema,
    outputSchema: BlogAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) throw new Error('Blog assistant failed.');
    return output;
  }
);
