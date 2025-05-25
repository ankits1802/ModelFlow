
'use client';

import React, { useActionState, useEffect, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Bot, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { handleGenerateDiagram, type GenerateDiagramFormState } from '@/lib/actions/diagramActions';
import type { Diagram } from './AiDiagramGeneratorPage';

interface AiGenerationPanelProps {
  onDiagramGenerated: (diagramContent: string, diagramType: 'ER' | 'DFD') => void;
}

const formSchema = z.object({
  textDescription: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
});

type FormData = z.infer<typeof formSchema>;

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
      Generate Diagram
    </Button>
  );
};

const AiGenerationPanel: React.FC<AiGenerationPanelProps> = ({ onDiagramGenerated }) => {
  const { toast } = useToast();
  const [selectedDiagramType, setSelectedDiagramType] = useState<'ER' | 'DFD'>('ER');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      textDescription: "",
    },
  });

  const initialState: GenerateDiagramFormState = { message: null, diagramContent: null, errorFields: {} };
  const [state, formAction] = useActionState(handleGenerateDiagram.bind(null, selectedDiagramType), initialState);

  const processedStateRef = useRef<{ message: string | null; content: string | null }>({ message: null, content: null });

  useEffect(() => {
    if (state.message) {
      // Check if this specific state (message and content combination) has already been processed
      const currentStateSignature = `${state.message}-${state.diagramContent}`;
      const processedStateSignature = `${processedStateRef.current.message}-${processedStateRef.current.content}`;

      if (currentStateSignature !== processedStateSignature) {
        if (state.diagramContent) {
          toast({
            title: "Success!",
            description: state.message,
            variant: "default",
          });
          onDiagramGenerated(state.diagramContent, selectedDiagramType);
          form.reset(); // Reset form after processing
        } else if (state.message.toLowerCase().includes("error") || (state.errorFields && Object.keys(state.errorFields).length > 0)) {
          toast({
            title: "Error",
            description: state.message || "Failed to generate diagram.",
            variant: "destructive",
          });
        } else {
          toast({ // For informational messages without diagram content
            title: "Info",
            description: state.message,
            variant: "default",
          });
        }
        // Mark this state as processed
        processedStateRef.current = { message: state.message, content: state.diagramContent };
      }
    }
  }, [state, toast, onDiagramGenerated, form, selectedDiagramType]);

  return (
    <Card className="shadow-lg flex-grow flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="mr-2 h-6 w-6 text-primary" />
          AI Diagram Generation
        </CardTitle>
        <CardDescription>
          Select diagram type, describe your system, and let AI draft an ER or DFD diagram for you.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form action={formAction} className="space-y-6 flex flex-col flex-grow">
          <CardContent className="space-y-4 flex flex-col flex-grow">
            <div className="space-y-2">
              <Label htmlFor="diagramTypeSelector">Diagram Type</Label>
              <Select value={selectedDiagramType} onValueChange={(value: 'ER' | 'DFD') => setSelectedDiagramType(value)}>
                <SelectTrigger id="diagramTypeSelector">
                  <SelectValue placeholder="Select diagram type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ER">Entity-Relationship (ER) Diagram</SelectItem>
                  <SelectItem value="DFD">Data Flow Diagram (DFD)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose the type of diagram you want to generate.
              </p>
            </div>

            <FormField
              control={form.control}
              name="textDescription"
              render={({ field }) => (
                <FormItem className="flex flex-col flex-grow">
                  <FormLabel htmlFor="textDescription">System Description</FormLabel>
                  <FormControl className="flex flex-col flex-grow">
                    <Textarea
                      id="textDescription"
                      placeholder="e.g., A customer can place multiple orders. Each order contains several products..."
                      className="resize-none flex-grow min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear, natural language description of your system.
                  </FormDescription>
                  <FormMessage />
                  {state?.errorFields?.textDescription && <p className="text-sm font-medium text-destructive">{state.errorFields.textDescription}</p>}
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default AiGenerationPanel;
