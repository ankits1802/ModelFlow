
'use server';
/**
 * @fileOverview A Genkit flow to convert Mermaid ERD code to SQL DDL.
 *
 * - convertMermaidToSql - A function that takes Mermaid ERD code and returns SQL DDL.
 * - ConvertMermaidToSqlInput - The input type for the convertMermaidToSql function.
 * - ConvertMermaidToSqlOutput - The return type for the convertMermaidToSql function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConvertMermaidToSqlInputSchema = z.object({
  mermaidCode: z
    .string()
    .min(10, { message: 'Mermaid code must be at least 10 characters long.' })
    .describe('The Mermaid ERD code to convert.'),
});
export type ConvertMermaidToSqlInput = z.infer<typeof ConvertMermaidToSqlInputSchema>;

const ConvertMermaidToSqlOutputSchema = z.object({
  sqlCode: z.string().describe('The generated SQL DDL statements.'),
  error: z.string().optional().describe('Any error message if conversion failed.'),
});
export type ConvertMermaidToSqlOutput = z.infer<typeof ConvertMermaidToSqlOutputSchema>;

export async function convertMermaidToSql(input: ConvertMermaidToSqlInput): Promise<ConvertMermaidToSqlOutput> {
  return convertMermaidToSqlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'convertMermaidToSqlPrompt',
  input: {schema: ConvertMermaidToSqlInputSchema},
  output: {schema: ConvertMermaidToSqlOutputSchema},
  prompt: `You are an expert database architect specializing in converting diagrammatic representations to SQL Data Definition Language (DDL).
You will be given Mermaid ERD code. Your task is to convert this Mermaid ERD code into SQL DDL statements.
Assume the target SQL dialect is PostgreSQL.

Pay close attention to:
- Entities and their attributes.
- Data types specified (interpret common Mermaid types like 'string', 'int', 'datetime', 'text', 'boolean' into appropriate PostgreSQL types like VARCHAR(255), INTEGER, TIMESTAMP, TEXT, BOOLEAN, etc.).
- If conceptual types like 'varchar_N' or 'decimal_P_S' are used in comments or attribute names, try to translate them to VARCHAR(N) or DECIMAL(P,S) respectively.
- Primary Keys (PK).
- Foreign Keys (FK) and their relationships. Ensure relationships are correctly translated into foreign key constraints with appropriate ON DELETE/ON UPDATE clauses (e.g., ON DELETE CASCADE or ON DELETE SET NULL, choosing a sensible default if not specified).
- Any comments in the Mermaid code that might indicate constraints like UNIQUE (UQ) or NOT NULL (NN), and translate them into SQL constraints.
- Relationship labels, if they provide useful context for naming constraints or understanding the relationship.

Generate only the SQL DDL code. If there's an issue with the Mermaid code that prevents conversion, provide a helpful error message in the 'error' field and leave 'sqlCode' empty.

Mermaid ERD Code:
\`\`\`mermaid
{{{mermaidCode}}}
\`\`\`

Generated SQL DDL (or error if applicable):
`,
});

const convertMermaidToSqlFlow = ai.defineFlow(
  {
    name: 'convertMermaidToSqlFlow',
    inputSchema: ConvertMermaidToSqlInputSchema,
    outputSchema: ConvertMermaidToSqlOutputSchema,
  },
  async (input: ConvertMermaidToSqlInput) => {
    try {
      const {output} = await prompt(input);
      if (output?.sqlCode && !output.error) {
        return { sqlCode: output.sqlCode.trim() };
      } else if (output?.error) {
        return { sqlCode: '', error: output.error };
      }
      // Fallback if output is not as expected
      return { sqlCode: '', error: 'AI model did not produce valid SQL or an error message.'};
    } catch (e: any) {
      console.error('Error in convertMermaidToSqlFlow:', e);
      return { sqlCode: '', error: e.message || 'An unexpected error occurred during SQL conversion.' };
    }
  }
);
