
'use client';

import type { FC } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Zap, ListChecks, Bot, DraftingCompass, Network, ArrowRight } from 'lucide-react';

const DashboardPage: FC = () => {
  return (
    <div className="flex flex-col h-full p-4 md:p-6 lg:p-8 gap-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between pb-4 border-b border-border">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Dashboard</h1>
      </header>

      {/* Quick Actions Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Link href="/ai-generator" className="flex flex-col p-6 h-full text-card-foreground hover:no-underline">
              <div className="flex items-center mb-3">
                <Bot className="h-7 w-7 text-primary mr-3 shrink-0" />
                <CardTitle className="text-lg leading-tight">AI Diagram Generator</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground flex-grow mb-4">
                Let AI assist you in creating Entity Relationship and Data Flow Diagrams from your textual descriptions.
              </p>
              <span className="mt-auto text-sm font-medium text-primary hover:text-primary/80 flex items-center self-start">
                Go to AI Generator <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Link href="/manual-editor" className="flex flex-col p-6 h-full text-card-foreground hover:no-underline">
              <div className="flex items-center mb-3">
                <DraftingCompass className="h-7 w-7 text-primary mr-3 shrink-0" />
                <CardTitle className="text-lg leading-tight">ERD Editor</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground flex-grow mb-4">
                Manually create and edit detailed Entity Relationship Diagrams using Mermaid syntax.
              </p>
              <span className="mt-auto text-sm font-medium text-primary hover:text-primary/80 flex items-center self-start">
                Go to ERD Editor <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Link href="/dfd-editor" className="flex flex-col p-6 h-full text-card-foreground hover:no-underline">
              <div className="flex items-center mb-3">
                <Network className="h-7 w-7 text-primary mr-3 shrink-0" />
                <CardTitle className="text-lg leading-tight">DFD Editor</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground flex-grow mb-4">
                Design Data Flow Diagrams with a suite of manual tools and live preview.
              </p>
              <span className="mt-auto text-sm font-medium text-primary hover:text-primary/80 flex items-center self-start">
                Go to DFD Editor <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          </Card>
        </div>
      </section>

      {/* Overview Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Overview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Diagrams</CardTitle>
              <BarChart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 since last week</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
              <Zap className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">35</div>
              <p className="text-xs text-muted-foreground">+5 today</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Review feedback</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Activity Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>An overview of recent diagram changes and generations.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
              <span className="text-sm">Generated 'Customer Order DFD'</span>
              <span className="text-xs text-muted-foreground">2 hours ago</span>
            </li>
            <li className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
              <span className="text-sm">Manually updated 'Inventory ERD'</span>
              <span className="text-xs text-muted-foreground">1 day ago</span>
            </li>
            <li className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
              <span className="text-sm">Exported 'User Authentication Flow' as SVG</span>
              <span className="text-xs text-muted-foreground">3 days ago</span>
            </li>
          </ul>
           {/* <img src="https://placehold.co/800x300.png" alt="Placeholder chart" data-ai-hint="activity chart" className="mt-4 w-full rounded-md object-cover" /> */}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
