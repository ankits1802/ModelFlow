'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  BrainCircuit,
  DraftingCompass,
  LayoutDashboard,
  Bot,
  Network,
  ArrowLeft, // Import ArrowLeft icon
} from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <BrainCircuit className="h-7 w-7" />
              <h1 className="text-xl font-semibold">ModelFlow</h1>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {/* Back Button */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={false}
                tooltip={{ children: 'Back', side: 'right' }}
              >
                <Link
                  href="https://6000-firebase-studio-1747578327375.cluster-zkm2jrwbnbd4awuedc2alqxrpk.cloudworkstations.dev/"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft />
                  <span>Back</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Dashboard */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip={{ children: 'Dashboard', side: 'right' }}
              >
                <Link href="/" className="flex items-center gap-2">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* AI Generator */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/ai-generator'}
                tooltip={{ children: 'AI Diagram Generator', side: 'right' }}
              >
                <Link href="/ai-generator" className="flex items-center gap-2">
                  <Bot />
                  <span>AI Generator</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* ERD Editor */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/manual-editor'}
                tooltip={{ children: 'ERD Editor', side: 'right' }}
              >
                <Link href="/manual-editor" className="flex items-center gap-2">
                  <DraftingCompass />
                  <span>ERD Editor</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* DFD Editor */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dfd-editor'}
                tooltip={{ children: 'DFD Editor', side: 'right' }}
              >
                <Link href="/dfd-editor" className="flex items-center gap-2">
                  <Network />
                  <span>DFD Editor</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6 sticky top-0 z-30">
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
