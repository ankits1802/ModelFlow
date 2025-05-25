// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, FileText, GitFork, Network, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AiGenerationPanel from './AiGenerationPanel';
import DiagramWorkspace from './DiagramWorkspace';
import { nanoid } from 'nanoid'; // For unique IDs, needs npm install nanoid

export interface Diagram {
  id: string;
  name: string;
  type: 'ER' | 'DFD' | 'Untitled';
  content: string | null;
}

let diagramCounter = 1;

const ModelFlowPage = () => {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize with one default tab
  useEffect(() => {
    if (diagrams.length === 0) {
      const newDiagramId = nanoid();
      const newDiagram: Diagram = {
        id: newDiagramId,
        name: `Diagram ${diagramCounter++}`,
        type: 'Untitled',
        content: null,
      };
      setDiagrams([newDiagram]);
      setActiveDiagramId(newDiagramId);
    }
  }, []); // Removed diagrams from dependency array to only run once

  const handleAddTab = useCallback(() => {
    const newDiagramId = nanoid();
    const newDiagramName = `Diagram ${diagramCounter++}`;
    const newDiagram: Diagram = {
      id: newDiagramId,
      name: newDiagramName,
      type: 'Untitled',
      content: null,
    };
    setDiagrams((prevDiagrams) => [...prevDiagrams, newDiagram]);
    setActiveDiagramId(newDiagramId);
    toast({ title: "New Tab Added", description: `${newDiagramName} created.` });
  }, []);

  const handleCloseTab = useCallback((idToClose: string) => {
    setDiagrams((prevDiagrams) => {
      const remainingDiagrams = prevDiagrams.filter(d => d.id !== idToClose);
      if (activeDiagramId === idToClose) {
        if (remainingDiagrams.length > 0) {
          setActiveDiagramId(remainingDiagrams[0].id);
        } else {
          setActiveDiagramId(null); 
          // Optionally, call handleAddTab here if you always want at least one tab
        }
      }
      if (remainingDiagrams.length === 0) { // If all tabs are closed, add a new default one
        const newId = nanoid();
        const newName = `Diagram ${diagramCounter++}`;
        setTimeout(() => { // Use setTimeout to avoid issues with React's batching during state updates
           setDiagrams([{ id: newId, name: newName, type: 'Untitled', content: null }]);
           setActiveDiagramId(newId);
        },0);
        return []; // Return empty first, then it will be repopulated
      }
      return remainingDiagrams;
    });
  }, [activeDiagramId]);

  const handleDiagramGenerated = useCallback((diagramContent: string, diagramType: 'ER' | 'DFD') => {
    if (activeDiagramId) {
      setDiagrams((prevDiagrams) =>
        prevDiagrams.map((diag) =>
          diag.id === activeDiagramId
            ? { ...diag, content: diagramContent, type: diagramType, name: `${diagramType} Diagram ${diag.name.split(' ').pop()}` } // Keep number if exists
            : diag
        )
      );
    } else {
      // If no active tab (e.g., all closed then generated), create a new one
      const newDiagramId = nanoid();
      const newDiagramName = `${diagramType} Diagram ${diagramCounter++}`;
      const newDiagram: Diagram = {
        id: newDiagramId,
        name: newDiagramName,
        type: diagramType,
        content: diagramContent,
      };
      setDiagrams((prevDiagrams) => [...prevDiagrams, newDiagram]);
      setActiveDiagramId(newDiagramId);
    }
  }, [activeDiagramId]);

  const handleExport = (format: 'PNG' | 'SVG' | 'PDF') => {
    toast({
      title: `Exporting Diagram...`,
      description: `Export as ${format} is a planned feature.`,
    });
    // Actual export logic would go here.
    // For Mermaid, SVG can be obtained from the rendered output.
    // PNG/PDF would require libraries like html2canvas, jspdf, or server-side rendering.
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans">
      <header className="flex items-center justify-between p-3 border-b border-border shadow-sm bg-card">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold text-primary">ModelFlow</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('SVG')}>
            <Download className="mr-2 h-4 w-4" /> SVG
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('PNG')}>
            <Download className="mr-2 h-4 w-4" /> PNG
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('PDF')}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </header>

      <main className="flex flex-grow p-4 gap-4 overflow-hidden">
        <div className="w-1/3 min-w-[380px] max-w-[500px] h-full overflow-y-auto pr-2">
          <AiGenerationPanel onDiagramGenerated={handleDiagramGenerated} />
        </div>
        <div className="flex-grow h-full min-w-0"> {/* Ensure this div can shrink and grow */}
          <DiagramWorkspace
            diagrams={diagrams}
            activeDiagramId={activeDiagramId}
            onTabChange={setActiveDiagramId}
            onAddTab={handleAddTab}
            onCloseTab={handleCloseTab}
          />
        </div>
      </main>
    </div>
  );
};

export default ModelFlowPage;
