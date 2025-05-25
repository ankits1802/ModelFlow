
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AiGenerationPanel from './AiGenerationPanel';
import DiagramWorkspace from './DiagramWorkspace';
import { nanoid } from '@/lib/utils';
import mermaid from 'mermaid';

export interface Diagram {
  id: string;
  name: string;
  type: 'ER' | 'DFD' | 'Untitled';
  content: string | null;
}


const AiDiagramGeneratorPage = () => {
  const { toast } = useToast();
  const diagramCounterRef = useRef(1);

  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);

  // State for renaming tabs
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const renameInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (diagrams.length === 0 && typeof window !== 'undefined') {
      const newDiagramId = nanoid();
      const newDiagramName = `Diagram ${diagramCounterRef.current++}`;
      const newDiagram: Diagram = {
        id: newDiagramId,
        name: newDiagramName,
        type: 'Untitled',
        content: null,
      };
      setDiagrams([newDiagram]);
      setActiveDiagramId(newDiagramId);
    }
  }, []);

  useEffect(() => {
    if (diagrams.length > 0) {
      if (!activeDiagramId || !diagrams.some(d => d.id === activeDiagramId)) {
        setActiveDiagramId(diagrams[0].id);
      }
    } else {
      if (activeDiagramId !== null) {
        setActiveDiagramId(null);
      }
    }
  }, [diagrams, activeDiagramId]);

  useEffect(() => {
    if (renamingTabId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingTabId]);

  const handleAddTab = useCallback(() => {
    const newDiagramId = nanoid();
    const newDiagramName = `Diagram ${diagramCounterRef.current++}`;
    const newDiagram: Diagram = {
      id: newDiagramId,
      name: newDiagramName,
      type: 'Untitled',
      content: null,
    };
    setDiagrams((prevDiagrams) => [...prevDiagrams, newDiagram]);
    setActiveDiagramId(newDiagramId);
    toast({ title: "New Tab Added", description: `${newDiagramName} created.` });
  }, [toast]);

  const handleCloseTab = useCallback((idToClose: string) => {
    let closedDiagramName = "Diagram";
    setDiagrams((prevDiagrams) => {
      const diagramToClose = prevDiagrams.find(d => d.id === idToClose);
      if (diagramToClose) {
        closedDiagramName = diagramToClose.name;
      }

      let newDiagrams = prevDiagrams.filter(d => d.id !== idToClose);
      if (newDiagrams.length === 0) {
        const newId = nanoid();
        const newName = `Diagram ${diagramCounterRef.current++}`;
        newDiagrams = [{ id: newId, name: newName, type: 'Untitled', content: null }];
      }
      return newDiagrams;
    });
    toast({ title: "Tab Closed", description: `${closedDiagramName} closed.` });
  }, [toast]);

  const handleDiagramGenerated = useCallback((diagramContent: string, diagramType: 'ER' | 'DFD') => {
    const activeTab = diagrams.find(d => d.id === activeDiagramId);
    const diagramNumberSuffixMatch = activeTab?.name.match(/\d+$/);
    let diagramNumberSuffix = diagramNumberSuffixMatch ? diagramNumberSuffixMatch[0] : '';
    
    if (!diagramNumberSuffix) { // If no number suffix, it means it was a default "Diagram X" or a renamed one without a number
      diagramNumberSuffix = (diagramCounterRef.current++).toString();
    }


    if (activeDiagramId) {
      setDiagrams((prevDiagrams) =>
        prevDiagrams.map((diag) =>
          diag.id === activeDiagramId
            ? { ...diag, content: diagramContent, type: diagramType, name: `${diagramType} Diagram ${diagramNumberSuffix}` }
            : diag
        )
      );
    } else {
      const newDiagramId = nanoid();
      const newDiagramName = `${diagramType} Diagram ${diagramNumberSuffix || diagramCounterRef.current++}`;
      const newDiagram: Diagram = {
        id: newDiagramId,
        name: newDiagramName,
        type: diagramType,
        content: diagramContent,
      };
      setDiagrams((prevDiagrams) => [...prevDiagrams, newDiagram]);
      setActiveDiagramId(newDiagramId);
    }
  }, [activeDiagramId, diagrams]);

  const activeDiagram = diagrams.find(d => d.id === activeDiagramId);

  const handleExportSVG = async () => {
    if (!activeDiagram || !activeDiagram.content) {
      toast({ title: 'Cannot Export', description: 'No diagram content to export.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Preparing SVG...', description: `Generating SVG for ${activeDiagram.name}.` });
    try {
      const uniqueId = `export-svg-${nanoid()}`;
      const { svg } = await mermaid.render(uniqueId, activeDiagram.content);
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeDiagram.name.replace(/\s+/g, '_') || 'diagram'}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'SVG Exported!', description: `${link.download} has been downloaded.` });
    } catch (error: any) {
      console.error('Error exporting SVG:', error);
      toast({ title: 'SVG Export Failed', description: error.message || 'Could not generate SVG.', variant: 'destructive' });
    }
  };

  const handleExportPNG = async () => {
    if (!activeDiagram || !activeDiagram.content) {
      toast({ title: 'Cannot Export', description: 'No diagram content to export.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Preparing PNG...', description: `Generating PNG for ${activeDiagram.name}. This may take a moment.` });
    try {
      const uniqueId = `export-png-${nanoid()}`;
      const { svg } = await mermaid.render(uniqueId, activeDiagram.content);
      const image = new Image();
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        const imgWidth = image.width || 800;
        const imgHeight = image.height || 600;
        canvas.width = imgWidth * scale;
        canvas.height = imgHeight * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          toast({ title: 'PNG Export Failed', description: 'Could not get canvas context.', variant: 'destructive' });
          URL.revokeObjectURL(url);
          return;
        }
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.drawImage(image, 0, 0, imgWidth, imgHeight);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${activeDiagram.name.replace(/\s+/g, '_') || 'diagram'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'PNG Exported!', description: `${link.download} has been downloaded.` });
      };
      image.onerror = (e) => {
        console.error('Error loading SVG into image for PNG export:', e);
        toast({ title: 'PNG Export Failed', description: 'Could not load SVG for PNG conversion.', variant: 'destructive' });
        URL.revokeObjectURL(url);
      };
      image.src = url;
    } catch (error: any) {
      console.error('Error exporting PNG:', error);
      toast({ title: 'PNG Export Failed', description: error.message || 'Could not generate PNG.', variant: 'destructive' });
    }
  };

  const handleDownloadMMD = () => {
    if (!activeDiagram || !activeDiagram.content || !activeDiagram.content.trim()) {
      toast({ title: 'Nothing to Download', description: 'The editor is empty or diagram is not active.', variant: 'destructive' });
      return;
    }
    const blob = new Blob([activeDiagram.content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeDiagram.name.replace(/\s+/g, '_') || 'diagram'}.mmd`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: 'Downloaded!', description: `${link.download} has been downloaded.` });
  };

  const handleExportPDF = () => {
    toast({
      title: `Exporting ${activeDiagram?.name || 'Diagram'}...`,
      description: `Export as PDF is a planned feature.`,
    });
  };

  // Renaming handlers
  const handleTabNameDoubleClick = (diagramId: string, currentName: string) => {
    setRenamingTabId(diagramId);
    setEditText(currentName);
  };

  const handleRenameCommit = () => {
    if (!renamingTabId) return;
    const originalName = diagrams.find(d => d.id === renamingTabId)?.name;
    if (editText.trim() && editText.trim() !== originalName) {
      setDiagrams(prev => prev.map(d => d.id === renamingTabId ? { ...d, name: editText.trim() } : d));
      toast({ title: "Diagram Renamed", description: `Renamed to "${editText.trim()}"` });
    } else if (!editText.trim()) {
        toast({ title: "Rename Cancelled", description: "Name cannot be empty.", variant: "destructive" });
    }
    setRenamingTabId(null);
    setEditText('');
  };

  const handleEditTextChange = (value: string) => {
    setEditText(value);
  };

  const handleRenameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleRenameCommit();
    } else if (event.key === 'Escape') {
      setRenamingTabId(null);
      setEditText('');
    }
  };
  
  const onTabChange = (id: string) => {
    setActiveDiagramId(id);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-sans animate-in fade-in duration-500">
      <header className="flex items-center justify-between p-3 border-b border-border shadow-sm bg-card">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">AI Diagram Generator</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadMMD} disabled={!activeDiagram || !activeDiagram.content}>
            <FileCode className="mr-2 h-4 w-4" /> .mmd
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportSVG} disabled={!activeDiagram || !activeDiagram.content}>
            <Download className="mr-2 h-4 w-4" /> SVG
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPNG} disabled={!activeDiagram || !activeDiagram.content}>
            <Download className="mr-2 h-4 w-4" /> PNG
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!activeDiagram || !activeDiagram.content}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </header>

      <main className="flex flex-grow p-4 gap-4 overflow-hidden">
        <div className="w-1/3 min-w-[380px] max-w-[500px] h-full overflow-y-auto pr-2 flex flex-col">
          <AiGenerationPanel onDiagramGenerated={handleDiagramGenerated} />
        </div>
        <div className="flex-grow h-full min-w-0">
          <DiagramWorkspace
            diagrams={diagrams}
            activeDiagramId={activeDiagramId}
            onTabChange={onTabChange}
            onAddTab={handleAddTab}
            onCloseTab={handleCloseTab}
            renamingTabId={renamingTabId}
            editText={editText}
            onEditTextChange={handleEditTextChange}
            onRenameCommit={handleRenameCommit}
            onRenameKeyDown={handleRenameKeyDown}
            onTabDoubleClick={handleTabNameDoubleClick}
            renameInputRef={renameInputRef}
          />
        </div>
      </main>
    </div>
  );
};

export default AiDiagramGeneratorPage;
