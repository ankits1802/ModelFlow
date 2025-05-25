'use server';

/**
 * @fileOverview Generates a draft ER diagram or DFD from a natural language description.
 *
 * - generateDiagramFromText - A function that generates a diagram from text.
 * - GenerateDiagramFromTextInput - The input type for the generateDiagramFromText function.
 * - GenerateDiagramFromTextOutput - The return type for the generateDiagramFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDiagramFromTextInputSchema = z.object({
  textDescription: z
    .string()
    .describe('A natural language description of the system.'),
  diagramType: z.enum(['ER', 'DFD']).describe('The type of diagram to generate.'),
});
export type GenerateDiagramFromTextInput = z.infer<
  typeof GenerateDiagramFromTextInputSchema
>;

const GenerateDiagramFromTextOutputSchema = z.object({
  diagramContent: z
    .string()
    .describe('The generated diagram content in a suitable format (e.g., Mermaid, JSON).'),
});
export type GenerateDiagramFromTextOutput = z.infer<
  typeof GenerateDiagramFromTextOutputSchema
>;

export async function generateDiagramFromText(
  input: GenerateDiagramFromTextInput
): Promise<GenerateDiagramFromTextOutput> {
  return generateDiagramFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDiagramFromTextPrompt',
  input: {schema: GenerateDiagramFromTextInputSchema},
  output: {schema: GenerateDiagramFromTextOutputSchema},
  prompt: `You are an expert diagram generator. You will take a text description of a system and generate a diagram of the specified type.

  The diagram should be in Mermaid format.

  Description: {{{textDescription}}}
  Diagram Type: {{{diagramType}}}

  Diagram:
  `,
});

const generateDiagramFromTextFlow = ai.defineFlow(
  {
    name: 'generateDiagramFromTextFlow',
    inputSchema: GenerateDiagramFromTextInputSchema,
    outputSchema: GenerateDiagramFromTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
