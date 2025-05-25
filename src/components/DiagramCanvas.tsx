// @ts-nocheck
'use client';

import type { FC } from 'react';
import { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Workflow, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiagramCanvasProps {
  diagramData: string | null;
  title: string;
}

const DiagramCanvas: FC<DiagramCanvasProps> = ({ diagramData, title }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [svgCode, setSvgCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uniqueMermaidIdBase = useId();

  // Fixed zoom and auto-fit state - auto-fit disabled by default
  const [zoomLevel, setZoomLevel] = useState(1);
  const [autoFit, setAutoFit] = useState(false); // Disabled by default
  const [fitToView, setFitToView] = useState(false); // Disabled by default
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  const zoomStep = 0.1;
  const minZoom = 0.3;
  const maxZoom = 3.0;

  const handleZoomIn = () => {
    setAutoFit(false);
    setFitToView(false);
    setZoomLevel(prev => Math.min(maxZoom, prev + zoomStep));
  };

  const handleZoomOut = () => {
    setAutoFit(false);
    setFitToView(false);
    setZoomLevel(prev => Math.max(minZoom, prev - zoomStep));
  };

  const handleFitToView = () => {
    setAutoFit(false);
    setFitToView(true);
    // Don't reset zoom level here, let calculation handle it
  };

  const handleAutoFit = () => {
    setFitToView(false);
    setAutoFit(!autoFit);
  };

  // Add resize observer to track container size
  useEffect(() => {
    if (!mermaidRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    
    resizeObserver.observe(mermaidRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Simplified scale and position calculation
  const getTransformStyle = () => {
    if (!mermaidRef.current) return { transform: `scale(${zoomLevel})` };
    
    const svgElement = mermaidRef.current.querySelector('svg');
    if (!svgElement) return { transform: `scale(${zoomLevel})` };
    
    // Get original SVG dimensions
    const svgWidth = svgElement.getAttribute('width') || svgElement.viewBox?.baseVal?.width || 800;
    const svgHeight = svgElement.getAttribute('height') || svgElement.viewBox?.baseVal?.height || 600;
    
    const containerWidth = containerDimensions.width || 800;
    const containerHeight = containerDimensions.height || 500;
    
    let scale = zoomLevel;
    
    if (fitToView) {
      // Calculate scale to fit with padding
      const scaleX = (containerWidth * 0.9) / parseFloat(svgWidth);
      const scaleY = (containerHeight * 0.9) / parseFloat(svgHeight);
      scale = Math.min(scaleX, scaleY, 2.0);
      scale = Math.max(scale, 0.3);
    } else if (autoFit) {
      // Auto-fit to width only
      const scaleToFit = (containerWidth * 0.95) / parseFloat(svgWidth);
      scale = Math.min(scaleToFit, 1.5);
      scale = Math.max(scale, 0.4);
    }

    return {
      transform: `scale(${scale})`,
      transformOrigin: 'top left'
    };
  };

  // Proper Mermaid initialization without useMaxWidth conflicts
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        useMaxWidth: false
      },
      gantt: {
        useMaxWidth: false
      },
      er: {
        useMaxWidth: false
      },
      class: {
        useMaxWidth: false
      }
    });
  }, []);

  useEffect(() => {
    if (diagramData) {
      setIsLoading(true);
      setError(null);

      let validationInput = diagramData.trim();
      let tempValidationInput = validationInput;
      
      // Strip leading Mermaid directives (%% ... %%) for validation purposes.
      while (tempValidationInput.startsWith('%%')) {
        const nextDirectiveEnd = tempValidationInput.indexOf('%%', 2);
        if (nextDirectiveEnd !== -1) {
          tempValidationInput = tempValidationInput.substring(nextDirectiveEnd + 2).trim();
        } else {
          const nextNewline = tempValidationInput.indexOf('\n');
          if (nextNewline !== -1 && tempValidationInput.substring(0, nextNewline).trim().endsWith('%%')) {
             tempValidationInput = tempValidationInput.substring(nextNewline + 1).trim();
          } else if (nextNewline !== -1) {
             tempValidationInput = tempValidationInput.substring(nextNewline + 1).trim();
          } else {
            tempValidationInput = "";
            break; 
          }
        }
      }
      
      const isLikelyMermaid = /^\s*(graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|flowchart|mindmap|timeline)/i.test(tempValidationInput);

      if (!isLikelyMermaid && tempValidationInput) {
          setError(`Content does not appear to be valid Mermaid syntax after initial directives. Ensure it includes a valid diagram type (e.g., 'graph TD', 'erDiagram'). Processed for check: \n${tempValidationInput.substring(0,100)}...\n\nOriginal input started with:\n${diagramData.trim().substring(0,100)}...`);
          setIsLoading(false);
          setSvgCode(null);
          return;
      }

      const renderMermaid = async () => {
        try {
          const renderId = `mermaid-${uniqueMermaidIdBase}-${Date.now()}`;
          const { svg } = await mermaid.render(renderId, diagramData);
          setSvgCode(svg);
          // Don't auto-enable anything - let user control
        } catch (e: any) {
          console.error("Mermaid rendering error:", e);
          let detailedError = e.message || String(e);
          if (e.str) {
            detailedError += `\nProblematic part: ${e.str}`;
          }
          setError(`Failed to render diagram. Please check syntax. ${detailedError}\n\nReceived Code:\n${diagramData}`);
          setSvgCode(null);
        } finally {
          setIsLoading(false);
        }
      };
      
      const timer = setTimeout(renderMermaid, 50);
      return () => clearTimeout(timer);
    } else {
      setSvgCode(null);
      setIsLoading(false);
      setError(null);
    }
  }, [diagramData, uniqueMermaidIdBase]);

  // Fixed header content
  const headerContent = (
    <div className="flex items-center gap-1">
      <Button 
        variant={autoFit ? "default" : "outline"} 
        size="sm" 
        onClick={handleAutoFit}
        className="h-7 px-2 text-xs"
      >
        Auto-fit
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleZoomOut} 
        disabled={zoomLevel <= minZoom} 
        className="h-7 w-7"
      >
        <ZoomOut className="h-4 w-4" />
        <span className="sr-only">Zoom Out</span>
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleZoomIn} 
        disabled={zoomLevel >= maxZoom} 
        className="h-7 w-7"
      >
        <ZoomIn className="h-4 w-4" />
        <span className="sr-only">Zoom In</span>
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="flex flex-col shadow-sm border-border w-full h-[600px]">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
          <CardTitle className="text-lg">{title}</CardTitle>
          {headerContent}
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center p-4">
          <Skeleton className="w-full h-full rounded-md" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="flex flex-col shadow-sm border-destructive w-full h-[600px]">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
          <CardTitle className="text-lg text-destructive flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error: {title}
          </CardTitle>
          {headerContent}
        </CardHeader>
        <CardContent className="flex-grow overflow-auto p-4">
          <div className="text-destructive p-4 border border-destructive bg-destructive/10 rounded-md whitespace-pre-wrap text-sm">
            <p className="font-semibold mb-2">Failed to render diagram:</p>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!diagramData || !svgCode) {
    return (
      <Card className="flex flex-col items-center justify-center shadow-sm border-border w-full h-[600px]">
        <CardHeader className="w-full flex flex-row items-center justify-between py-3 px-4 border-b">
            <CardTitle className="text-lg">{title}</CardTitle>
            {headerContent}
        </CardHeader>
        <CardContent className="text-center flex-grow flex flex-col items-center justify-center p-4">
          <Workflow className="w-20 h-20 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">Canvas Ready</p>
          <p className="text-sm text-muted-foreground mt-2">
            {diagramData ? "Generating diagram..." : "Generate a diagram or start editing manually."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm border-border flex flex-col h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b sticky top-0 bg-card z-10">
        <CardTitle className="text-lg">{title}</CardTitle>
        {headerContent}
      </CardHeader>
      <CardContent className="flex-grow p-4 overflow-auto">
        {svgCode && (
          <div
            ref={mermaidRef}
            className="mermaid-container w-full h-full"
            style={{ 
              minHeight: '500px',
              position: 'relative'
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: svgCode }}
              style={{ 
                ...getTransformStyle(),
                transition: 'transform 0.2s ease-out',
                width: 'fit-content',
                height: 'fit-content'
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiagramCanvas;
