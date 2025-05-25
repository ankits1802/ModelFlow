
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Download,
  Trash2,
  PencilRuler,
  FileText,
  Settings2,
  PlusCircle, 
  Copy,
  FileCode,
  ArrowRight, 
  Shapes, 
  XIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from '@/lib/utils';
import type { Diagram } from './AiDiagramGeneratorPage'; 
import mermaid from 'mermaid';
import DiagramWorkspace from './DiagramWorkspace';

const MINIMAL_DFD_CONTENT = 'graph TD\n';
const DEFAULT_DFD_CONTENT =
  'graph TD\n    A["User Submits Data"] --> B{Process Data};\n    B --> C["Display Results"];\n    D(External System) --> A;';

const EXAMPLE_DFD_DIAGRAMS = [
  {
    label: 'Simple Order Process',
    content: `graph TD
    Customer -- Order --> A{Process Order};
    A -- Validated Order --> B[Dispatch Goods];
    B -- Shipment Details --> Customer;
    A -- Invoice Data --> C[Generate Invoice];
    C -- Invoice --> Customer;
    StockDb([Stock Database]) --> A;
    A --> StockDb;`,
  },
  {
    label: 'User Authentication Flow',
    content: `graph LR
    User(User) -- Credentials --> AppUI[Application UI];
    AppUI -- Login Request --> AuthSvc{Authentication Service};
    AuthSvc -- Validate --> UserDB[(User Database)];
    UserDB -- User Record/Error --> AuthSvc;
    AuthSvc -- Auth Token/Error --> AppUI;
    AppUI -- Access --> ProtectedPage[Protected Resource];`,
  },
  {
    label: 'Website Data Flow',
    content: `graph TD
    User(User) -- HTTP Request --> WebServer[Web Server];
    WebServer -- Serve Static Content --> User;
    WebServer -- API Request --> APIService{API Service};
    APIService -- Query/Update --> Database[(Primary DB)];
    Database -- Data --> APIService;
    APIService -- Response --> WebServer;
    WebServer -- Dynamic Content --> User;
    APIService -- Log Event --> LoggingService[Logging Service];
    LoggingService --> LogStorage([Log Storage]);`,
  },
];

interface DfdToolItem {
  label: string;
  mermaid: string;
  description?: string;
}

interface DfdToolCategory {
  categoryLabel: string;
  categoryIcon: JSX.Element;
  items: DfdToolItem[];
}

const DFD_TOOLS_CATEGORIES: DfdToolCategory[] = [
  {
    categoryLabel: 'Nodes',
    categoryIcon: <Shapes className="mr-2 h-4 w-4" />, // Ensure Shapes is imported or use a string
    items: [
      {
        label: 'Process (Rectangle)',
        mermaid: '    ID["Process Description"]',
        description: 'Adds a process node (rectangle). Replace ID and Description.',
      },
      {
        label: 'External Entity (Rounded)',
        mermaid: '    ID(External Entity)',
        description: 'Adds an external entity node (rounded rectangle/oval). Replace ID.',
      },
      {
        label: 'Data Store (Open Rectangle)',
        mermaid: '    ID([Data Store Name])',
        description: 'Adds a data store node (open-ended rectangle). Replace ID and Name.',
      },
        {
        label: 'Data Store (Cylinder)',
        mermaid: '    ID[(Data Store Name)]',
        description: 'Adds a data store node (cylinder shape). Replace ID and Name.',
      },
    ],
  },
  {
    categoryLabel: 'Data Flows',
    categoryIcon: <ArrowRight className="mr-2 h-4 w-4" />,
    items: [
      {
        label: 'Simple Flow (A --> B)',
        mermaid: '    A --> B',
        description: 'Adds a simple data flow from node A to node B.',
      },
      {
        label: 'Flow with Label (A --Label--> B)',
        mermaid: '    A --"Data Label"--> B',
        description: 'Adds a data flow with a label.',
      },
      {
        label: 'Flow with Label (A -->|Label| B)',
        mermaid: '    A -->|"Data Label"| B',
        description: 'Alternative syntax for data flow with a label.',
      },
      {
        label: 'Dotted Flow (A-.-> B)',
        mermaid: '    A-.->B',
        description: 'Adds a dotted/dashed data flow.',
      },
      {
        label: 'Dotted Flow with Label',
        mermaid: '    A-. "Control Signal" .-> B',
        description: 'Adds a dotted data flow with a label.',
      },
    ],
  },
  {
    categoryLabel: 'Subgraphs (Grouping)',
    categoryIcon: <Shapes className="mr-2 h-4 w-4" />, 
    items: [
      {
        label: 'Simple Subgraph',
        mermaid: 'subgraph "Subgraph Title"\n    S1_A --> S1_B\nend',
        description: 'Groups nodes within a titled subgraph.',
      },
      {
        label: 'Subgraph with Direction',
        mermaid: 'subgraph "Titled Group" TD\n    G_A["Node A"] --> G_B["Node B"]\nend',
        description: 'A subgraph with its own layout direction (e.g., TD).',
      },
    ],
  },
  {
    categoryLabel: 'Diagram Directives',
    categoryIcon: <Settings2 className="mr-2 h-4 w-4" />,
    items: [
      { label: 'Comment', mermaid: '    %% This is a comment', description: 'Adds a comment to your DFD.' },
      { label: 'Layout: Top-Down (TD)', mermaid: 'graph TD', description: 'Sets diagram layout to Top-Down. Use at the beginning, replacing the default `graph` line.' },
      { label: 'Layout: Left-to-Right (LR)', mermaid: 'graph LR', description: 'Sets diagram layout to Left-to-Right. Use at the beginning, replacing the default `graph` line.' },
      { label: 'Theme: Default', mermaid: "%%{init: {'theme': 'default'}}%%", description: "Sets diagram theme to Mermaid's default. Add at the very beginning." },
      { label: 'Theme: Neutral', mermaid: "%%{init: {'theme': 'neutral'}}%%", description: "Sets diagram theme to neutral. Add at the very beginning." },
      { label: 'Theme: Forest', mermaid: "%%{init: {'theme': 'forest'}}%%", description: "Sets diagram theme to forest (green tones). Add at the very beginning." },
      { label: 'Theme: Dark', mermaid: "%%{init: {'theme': 'dark'}}%%", description: "Sets diagram theme to dark. Add at the very beginning." },
      { label: 'Theme: Base', mermaid: "%%{init: {'theme': 'base'}}%%", description: "Sets diagram theme to base (for CSS variable customization). Add at the very beginning." },
    ],
  },
];

const DfdEditorPage = () => {
  const { toast } = useToast();
  const diagramCounterRef = useRef(1);

  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (diagrams.length === 0 && typeof window !== 'undefined') {
      const newDiagramId = nanoid();
      const newDiagramName = `DFD ${diagramCounterRef.current++}`;
      const newDiagram: Diagram = {
        id: newDiagramId,
        name: newDiagramName,
        type: 'DFD' as const,
        content: DEFAULT_DFD_CONTENT,
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

  const activeDiagram = diagrams.find((d) => d.id === activeDiagramId);
  const mermaidCode = activeDiagram?.content || '';

  const handleMermaidCodeChange = (newCode: string) => {
    if (activeDiagramId) {
      setDiagrams((prevDiagrams) =>
        prevDiagrams.map((diag) =>
          diag.id === activeDiagramId ? { ...diag, content: newCode } : diag
        )
      );
    }
  };

  const insertMermaidSnippet = (snippetToInsert: string) => {
    if (!activeDiagram) return;

    let currentCode = activeDiagram.content || MINIMAL_DFD_CONTENT;
    let lines = currentCode.split('\n');
    const snippetTrimmed = snippetToInsert.trim();
    const snippetLines = snippetTrimmed.split('\n');

    const isThemeDirective = snippetTrimmed.startsWith("%%{init: {'theme':");
    const isConfigDirective = snippetTrimmed.startsWith("%% @config");
    const isLayoutDirective = snippetTrimmed.match(/^graph(\s+(TD|LR|RL|BT))?$/i);
    const isCommentDirective = snippetTrimmed.startsWith("%%") && !isThemeDirective && !isConfigDirective;

    if (isThemeDirective) {
        lines = lines.filter(line => !line.trim().startsWith("%%{init: {'theme':"));
        lines.unshift(snippetTrimmed);
        const themeName = snippetTrimmed.match(/'([^']*)'/)?.[1] || 'selected theme';
        toast({ title: 'Theme Applied', description: `Set theme to: ${themeName}` });
    } else if (isConfigDirective) {
        let configBlockStartIndex = -1;
        let configBlockEndIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith("%% @config")) {
                configBlockStartIndex = i;
                for (let j = i; j < lines.length; j++) {
                    if (lines[j].trim().endsWith("%%") && j > i) {
                        configBlockEndIndex = j;
                        break;
                    }
                }
                break;
            }
        }
        if (configBlockStartIndex !== -1 && configBlockEndIndex !== -1) {
            lines.splice(configBlockStartIndex, configBlockEndIndex - configBlockStartIndex + 1);
        } else if (configBlockStartIndex !== -1) {
            lines.splice(configBlockStartIndex, 1);
        }
        let insertAtIndex = lines.findIndex(line => line.trim().startsWith("%%{init: {'theme':"));
        insertAtIndex = (insertAtIndex === -1) ? 0 : insertAtIndex + 1;
        lines.splice(insertAtIndex, 0, ...snippetLines);
        toast({ title: 'Config Applied', description: 'Configuration block updated/added.' });
    } else if (isLayoutDirective) {
        const graphLineIndex = lines.findIndex(line => line.trim().match(/^graph(\s+(TD|LR|RL|BT))?$/i));
        if (graphLineIndex !== -1) {
            lines.splice(graphLineIndex, 1);
        }
        let insertAtIndex = 0;
        const lastThemeDirectiveIndex = lines.reduce((acc, line, idx) => line.trim().startsWith("%%{init:") ? idx : acc, -1);
        let lastConfigDirectiveEndIndex = -1;
        let inConfigBlock = false;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith("%% @config")) inConfigBlock = true;
            if (inConfigBlock && lines[i].trim().endsWith("%%")) {
                lastConfigDirectiveEndIndex = i;
                inConfigBlock = false;
            }
        }
        if (lastConfigDirectiveEndIndex !== -1) {
            insertAtIndex = lastConfigDirectiveEndIndex + 1;
        } else if (lastThemeDirectiveIndex !== -1) {
            insertAtIndex = lastThemeDirectiveIndex + 1;
        }
        lines.splice(insertAtIndex, 0, snippetTrimmed);
        toast({ title: 'Layout Applied', description: `Diagram layout set to: ${snippetTrimmed}` });
    } else {
        if (lines.length === 0 && !isCommentDirective) {
            lines.push(MINIMAL_DFD_CONTENT.trim());
        }
        if (lines.length > 0 && lines[lines.length - 1].trim() !== "" && !isCommentDirective) {
             lines.push("");
        }
        lines.push(...snippetLines);
        toast({ title: 'Snippet Added', description: 'Mermaid code updated.' });
    }

    let newCode = lines.join('\n');
    newCode = newCode.replace(/\n{3,}/g, '\n\n').trim();
    if (!newCode && !isCommentDirective && !isThemeDirective && !isConfigDirective && !isLayoutDirective) {
      newCode = MINIMAL_DFD_CONTENT;
    } else if (newCode && !newCode.match(/^(\s*%%.*%%\s*)*graph/i) && !isCommentDirective && !isThemeDirective && !isConfigDirective && !isLayoutDirective) {
      let insertPoint = 0;
      for(let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith("%%")) {
          insertPoint = i + 1;
        } else {
          break;
        }
      }
      if (!lines.some(line => line.trim().match(/^graph/i))) {
        lines.splice(insertPoint, 0, MINIMAL_DFD_CONTENT.trim());
      }
      newCode = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }
    handleMermaidCodeChange(newCode);
  };

  const loadExampleDiagram = (content: string) => {
    if (!activeDiagram) return;
    handleMermaidCodeChange(content);
    toast({ title: 'Example DFD Loaded', description: 'Editor updated with example diagram.' });
  };

  const handleExportSVG = async () => {
    const currentDiagram = diagrams.find(d => d.id === activeDiagramId);
    if (!currentDiagram || !currentDiagram.content) {
      toast({ title: 'Cannot Export', description: 'No diagram content to export.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Preparing SVG...', description: `Generating SVG for ${currentDiagram.name}.` });
    try {
      const uniqueId = `export-svg-${nanoid()}`;
      const { svg } = await mermaid.render(uniqueId, currentDiagram.content);
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentDiagram.name.replace(/\s+/g, '_') || 'diagram'}.svg`;
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
    const currentDiagram = diagrams.find(d => d.id === activeDiagramId);
    if (!currentDiagram || !currentDiagram.content) {
      toast({ title: 'Cannot Export', description: 'No diagram content to export.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Preparing PNG...', description: `Generating PNG for ${currentDiagram.name}. This may take a moment.` });
    try {
      const uniqueId = `export-png-${nanoid()}`;
      const { svg } = await mermaid.render(uniqueId, currentDiagram.content);
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
        link.download = `${currentDiagram.name.replace(/\s+/g, '_') || 'diagram'}.png`;
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
    if (!activeDiagram || !mermaidCode.trim()) {
      toast({ title: 'Nothing to Download', description: 'The editor is empty or diagram is not active.', variant: 'destructive' });
      return;
    }
    const blob = new Blob([mermaidCode], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeDiagram.name.replace(/\s+/g, '_') || 'diagram'}.mmd`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: 'Downloaded!', description: `${activeDiagram.name}.mmd has been downloaded.` });
  };

  const handleClearCanvas = () => {
    if (!activeDiagram) return;
    handleMermaidCodeChange(MINIMAL_DFD_CONTENT);
    toast({ title: 'Canvas Cleared', description: 'Ready for a new DFD.' });
  };

  const handleCopyMermaidCode = async () => {
    if (!mermaidCode) {
      toast({ title: 'Nothing to Copy', description: 'The editor is empty.', variant: 'destructive' });
      return;
    }
    try {
      await navigator.clipboard.writeText(mermaidCode);
      toast({ title: 'Code Copied!', description: 'Mermaid code copied to clipboard.' });
    } catch (err) {
      console.error('Failed to copy Mermaid code: ', err);
      toast({ title: 'Copy Failed', description: 'Could not copy Mermaid code.', variant: 'destructive' });
    }
  };

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

  const handleAddTab = useCallback(() => {
    const newDiagramId = nanoid();
    const newDiagramName = `DFD ${diagramCounterRef.current++}`;
    const newDiagram: Diagram = {
      id: newDiagramId,
      name: newDiagramName,
      type: 'DFD' as const,
      content: DEFAULT_DFD_CONTENT,
    };
    setDiagrams((prevDiagrams) => [...prevDiagrams, newDiagram]);
    setActiveDiagramId(newDiagramId);
    toast({ title: 'New Tab Added', description: `${newDiagramName} created.` });
  }, [toast]);

  const handleCloseTab = useCallback(
    (idToClose: string) => {
      let closedDiagramName = "Diagram";
      setDiagrams((prevDiagrams) => {
        const diagramToClose = prevDiagrams.find(d => d.id === idToClose);
        if (diagramToClose) {
          closedDiagramName = diagramToClose.name;
        }
        let newDiagrams = prevDiagrams.filter((d) => d.id !== idToClose);
        if (newDiagrams.length === 0) {
          const newId = nanoid();
          const newName = `DFD ${diagramCounterRef.current++}`;
          newDiagrams = [{ id: newId, name: newName, type: 'DFD' as const, content: DEFAULT_DFD_CONTENT }];
        }
        return newDiagrams;
      });
      toast({ title: "Tab Closed", description: `${closedDiagramName} closed.` });
    },
    [toast]
  );

  const onTabChange = (id: string) => {
    setActiveDiagramId(id);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-sans animate-in fade-in duration-500">
      <header className="flex items-center justify-between p-3 border-b border-border shadow-sm bg-card">
        <h2 className="text-xl font-semibold text-foreground">DFD Editor</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClearCanvas} disabled={!activeDiagram}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadMMD} disabled={!activeDiagram || !mermaidCode.trim()}>
            <FileCode className="mr-2 h-4 w-4" /> Download .mmd
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportSVG} disabled={!activeDiagram || !mermaidCode.trim()}>
            <Download className="mr-2 h-4 w-4" /> SVG
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPNG} disabled={!activeDiagram || !mermaidCode.trim()}>
            <Download className="mr-2 h-4 w-4" /> PNG
          </Button>
        </div>
      </header>

      <main className="flex flex-grow p-4 gap-4">
        <TooltipProvider>
          <Card className="w-1/4 min-w-[320px] max-w-[450px] shadow-lg flex flex-col h-full">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center">
                <PencilRuler className="mr-2 h-5 w-5 text-primary" />
                DFD Tools & Examples
              </CardTitle>
              <CardDescription className="text-center">Select elements to add or load an example.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto flex-grow px-4 pb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-center" disabled={!activeDiagram}>
                    <FileText className="mr-2 h-4 w-4" /> Load Example <PlusCircle className="ml-auto h-4 w-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width)] max-h-96 overflow-y-auto">
                  <DropdownMenuLabel>Select an Example DFD</DropdownMenuLabel>
                   <Separator className="my-1 bg-border -mx-1" />
                  {EXAMPLE_DFD_DIAGRAMS.map((ex) => (
                    <DropdownMenuItem key={ex.label} onClick={() => loadExampleDiagram(ex.content)}>
                      {ex.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator className="my-3 bg-border" /> 

              {DFD_TOOLS_CATEGORIES.map((category) => (
                <DropdownMenu key={category.categoryLabel}>
                  <DropdownMenuTrigger asChild>
                     <Button variant="outline" className="w-full justify-center" disabled={!activeDiagram}>
                      {category.categoryIcon} <span className="ml-2 truncate">{category.categoryLabel}</span> <PlusCircle className="ml-auto h-4 w-4 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width)] max-h-96 overflow-y-auto">
                    <DropdownMenuLabel>{category.categoryLabel}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {category.items.map((item) => (
                       <Tooltip key={item.label} delayDuration={100}>
                        <TooltipTrigger asChild>
                          <DropdownMenuItem onClick={() => insertMermaidSnippet(item.mermaid)} className="text-xs">
                            {item.label}
                          </DropdownMenuItem>
                        </TooltipTrigger>
                        {item.description && (
                           <TooltipContent side="right" align="start" className="max-w-xs z-50">
                            <p className="text-sm font-semibold mb-1">Insert Snippet:</p>
                            <pre className="text-xs bg-muted p-2 rounded-md whitespace-pre-wrap">{item.mermaid}</pre>
                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </CardContent>
          </Card>
        </TooltipProvider>

        <div className="flex-grow flex flex-col gap-4 min-w-0">
          {/* Card for Mermaid Code Editor */}
          <div className="flex-grow-[2] flex flex-col shadow-md min-h-0"> {/* Smaller proportion for code */}
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>{activeDiagram?.name || "Mermaid Code"} - Mermaid Code</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopyMermaidCode} disabled={!mermaidCode.trim() || !activeDiagram}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Code
                </Button>
              </CardHeader>
              <CardContent className="flex-grow p-2 pt-0">
                {activeDiagram ? (
                  <Textarea
                    value={mermaidCode}
                    onChange={(e) => handleMermaidCodeChange(e.target.value)}
                    placeholder="graph TD\n    A[Start] --> B{Decision};\n    B -- Yes --> C[End];\n    B -- No --> D[Alternative];"
                    className="h-full w-full resize-none font-mono text-sm min-h-[150px]" // min-h for code editor
                    aria-label="Mermaid Code Editor for DFD"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select or create a DFD to start editing.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* DiagramWorkspace for Diagram Preview Tabs */}
          <div className="flex-grow-[3] flex flex-col min-h-0"> {/* Larger proportion for preview */}
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
        </div>
      </main>
    </div>
  );
};

export default DfdEditorPage;

