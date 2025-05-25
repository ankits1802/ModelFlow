
// @ts-nocheck
'use client';

import type { FC } from 'react';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DiagramCanvas from './DiagramCanvas';
import type { Diagram } from './AiDiagramGeneratorPage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PlusCircle, XIcon } from 'lucide-react';

interface DiagramWorkspaceProps {
  diagrams: Diagram[];
  activeDiagramId: string | null;
  onTabChange: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  renamingTabId?: string | null;
  editText?: string;
  onEditTextChange?: (value: string) => void;
  onRenameCommit?: () => void;
  onRenameKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onTabDoubleClick?: (diagramId: string, currentName: string) => void;
  renameInputRef?: React.RefObject<HTMLInputElement>;
}

const DiagramWorkspace: FC<DiagramWorkspaceProps> = ({
  diagrams,
  activeDiagramId,
  onTabChange,
  onAddTab,
  onCloseTab,
  renamingTabId,
  editText,
  onEditTextChange,
  onRenameCommit,
  onRenameKeyDown,
  onTabDoubleClick,
  renameInputRef,
}) => {

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-md border border-border">
      <Tabs value={activeDiagramId || undefined} onValueChange={onTabChange} className="flex flex-col flex-grow">
        <div className="p-2 border-b border-border sticky top-0 bg-card z-20">
          <TabsList className="bg-muted p-1 rounded-md">
            {diagrams.map((diagram) => (
              <TabsTrigger
                key={diagram.id}
                value={diagram.id}
                className="relative group data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-accent/50 transition-colors duration-150"
                onClick={(e) => {
                  if (renamingTabId === diagram.id && e.target instanceof HTMLInputElement) {
                    e.stopPropagation();
                  }
                }}
              >
                {renamingTabId === diagram.id && onEditTextChange && onRenameCommit && onRenameKeyDown ? (
                  <Input
                    ref={renameInputRef}
                    type="text"
                    value={editText}
                    onChange={(e) => onEditTextChange(e.target.value)}
                    onBlur={onRenameCommit}
                    onKeyDown={onRenameKeyDown}
                    className="h-6 px-1 text-sm bg-transparent border border-primary focus:ring-1 focus:ring-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    onDoubleClick={() => onTabDoubleClick?.(diagram.id, diagram.name)}
                    className="px-1 py-0.5"
                  >
                    {diagram.name}
                  </span>
                )}
                {diagrams.length > 0 && ( 
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(diagram.id);
                    }}
                    className="ml-2 p-0.5 rounded-full opacity-50 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-opacity cursor-pointer"
                    aria-label={`Close ${diagram.name} tab`}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </span>
                )}
              </TabsTrigger>
            ))}
            <Button variant="ghost" size="sm" onClick={onAddTab} className="ml-2 px-2 py-1 h-auto">
              <PlusCircle className="h-4 w-4 mr-1" /> Add
            </Button>
          </TabsList>
        </div>

        {diagrams.map((diagram) => (
          <TabsContent key={diagram.id} value={diagram.id} className="m-0 mt-0 animate-in fade-in-50 duration-300">
            {/* Removed flex-grow and overflow-auto, removed h-full w-full from inner div */}
            <div className="w-full"> 
              <DiagramCanvas diagramData={diagram.content} title={diagram.name} />
            </div>
          </TabsContent>
        ))}
        {diagrams.length === 0 && (
          <div className="flex-grow flex items-center justify-center p-4 text-muted-foreground">
            No diagrams open. Click "Add" to create a new diagram.
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default DiagramWorkspace;
