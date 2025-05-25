
// @ts-nocheck
'use server';

import { generateDiagramFromText, type GenerateDiagramFromTextInput } from '@/ai/flows/generate-diagram-from-text';
import { convertMermaidToSql, type ConvertMermaidToSqlInput } from '@/ai/flows/convert-mermaid-to-sql-flow';
import { z } from 'zod';

// Schema now only validates textDescription
const GenerateDiagramSchema = z.object({
  textDescription: z.string().min(10, "Description must be at least 10 characters long."),
  // diagramType is no longer part of the form data schema for this action
});

export interface GenerateDiagramFormState {
  message: string | null;
  diagramContent: string | null;
  // Error fields will now only contain textDescription if there's an error with it
  errorFields?: { textDescription?: string };
}

export async function handleGenerateDiagram(
  diagramType: 'ER' | 'DFD', // diagramType is now the first argument
  prevState: GenerateDiagramFormState,
  formData: FormData
): Promise<GenerateDiagramFormState> {
  const rawFormData = {
    textDescription: formData.get('textDescription'),
  };

  const validatedFields = GenerateDiagramSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check the description.",
      diagramContent: null,
      errorFields: validatedFields.error.flatten().fieldErrors as { textDescription?: string },
    };
  }

  try {
    // Construct input for the Genkit flow using the bound diagramType
    const flowInput: GenerateDiagramFromTextInput = {
      textDescription: validatedFields.data.textDescription,
      diagramType: diagramType, // Use the bound diagramType
    };

    const result = await generateDiagramFromText(flowInput);
    if (result.diagramContent) {
      return {
        message: "Diagram generated successfully!",
        diagramContent: result.diagramContent,
        errorFields: {},
      };
    } else {
      return {
        message: "AI generated an empty diagram. Try refining your description.",
        diagramContent: null,
        errorFields: {},
      };
    }
  } catch (error) {
    console.error("Error generating diagram:", error);
    let errorMessage = "An unexpected error occurred while generating the diagram.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      message: `Error: ${errorMessage}`,
      diagramContent: null,
      errorFields: {},
    };
  }
}


const ConvertToSqlSchema = z.object({
  mermaidCode: z.string().min(10, "Mermaid code must be at least 10 characters to convert."),
});

export interface ConvertToSqlFormState {
  sqlCode?: string | null;
  error?: string | null;
  message?: string | null; // General message for UI
}

export async function handleConvertToSql(
  mermaidCode: string
): Promise<ConvertToSqlFormState> {
  const validatedFields = ConvertToSqlSchema.safeParse({ mermaidCode });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.mermaidCode?.join(', ') || "Invalid Mermaid code provided.",
    };
  }

  try {
    const result = await convertMermaidToSql({ mermaidCode: validatedFields.data.mermaidCode });
    if (result.error) {
      return { error: result.error };
    }
    if (result.sqlCode) {
      return { sqlCode: result.sqlCode, message: "SQL generated successfully!" };
    }
    return { error: "SQL generation failed to produce code." };
  } catch (error) {
    console.error("Error converting to SQL:", error);
    let errorMessage = "An unexpected error occurred during SQL conversion.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}
