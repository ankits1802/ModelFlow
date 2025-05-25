'use server';
/**
 * @fileOverview A flow that takes a diagram (ER or DFD) as input and generates a textual summary of it.
 *
 * - explainDiagramAsText - A function that takes the diagram as input and returns a textual summary.
 * - ExplainDiagramAsTextInput - The input type for the explainDiagramAsText function.
 * - ExplainDiagramAsTextOutput - The return type for the explainDiagramAsText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainDiagramAsTextInputSchema = z.object({
  diagramDataUri: z
    .string()
    .describe(
      "A diagram (ER or DFD), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  diagramType: z.enum(['ER', 'DFD']).describe('The type of the diagram (ER or DFD).'),
});
export type ExplainDiagramAsTextInput = z.infer<typeof ExplainDiagramAsTextInputSchema>;

const ExplainDiagramAsTextOutputSchema = z.object({
  summary: z.string().describe('A textual summary of the diagram, including entity roles, relationships, constraints (for ERDs) or process descriptions and data transformations (for DFDs).'),
});
export type ExplainDiagramAsTextOutput = z.infer<typeof ExplainDiagramAsTextOutputSchema>;

export async function explainDiagramAsText(input: ExplainDiagramAsTextInput): Promise<ExplainDiagramAsTextOutput> {
  return explainDiagramAsTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainDiagramAsTextPrompt',
  input: {schema: ExplainDiagramAsTextInputSchema},
  output: {schema: ExplainDiagramAsTextOutputSchema},
  prompt: `You are an expert in creating documentation for software diagrams.

You will receive a diagram, and your job is to generate a textual summary of the diagram.

If the diagram is an ER diagram, the summary should include entity roles, relationships, and constraints.
If the diagram is a DFD, the summary should include process descriptions and data transformations.

Diagram Type: {{{diagramType}}}
Diagram: {{media url=diagramDataUri}}

Summary: `,
});

const explainDiagramAsTextFlow = ai.defineFlow(
  {
    name: 'explainDiagramAsTextFlow',
    inputSchema: ExplainDiagramAsTextInputSchema,
    outputSchema: ExplainDiagramAsTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
