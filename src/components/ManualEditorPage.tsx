'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Download,
  Trash2,
  PencilRuler,
  Shapes, 
  Link2, 
  Type, 
  FileText,
  Settings2,
  PlusCircle, 
  Copy,
  FileCode,
  Database,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from '@/lib/utils';
import type { Diagram } from './AiDiagramGeneratorPage'; 
import { handleConvertToSql } from '@/lib/actions/diagramActions';
import mermaid from 'mermaid';
import DiagramWorkspace from './DiagramWorkspace';

const MINIMAL_ERD_CONTENT = 'erDiagram\n';
const DEFAULT_ERD_CONTENT =
  'erDiagram\n    USER {\n        int id PK "User ID"\n        string username "Username"\n        string email "Email address"\n        datetime createdAt "Timestamp of creation"\n    }\n    PROFILE {\n        int id PK "Profile ID"\n        string bio "User biography"\n        int userId FK "Foreign key to USER table"\n    }\n    POST {\n        int id PK "Post ID"\n        string title "Post title"\n        text content "Post content"\n        int authorId FK "Foreign key to USER table (author)"\n        datetime publishedAt "Timestamp of publication"\n    }\n    USER ||--o{ PROFILE : "has one"\n    USER ||--o{ POST : "writes"';

const EXAMPLE_DIAGRAMS = [
  {
    label: 'Simple User-Profile (ERD)',
    content:
      'erDiagram\n    USER {\n        int id PK\n        string name\n    }\n    PROFILE {\n        int user_id FK\n        string bio\n    }\n    USER ||--o{ PROFILE : "has"',
  },
  {
    label: 'E-commerce System (ERD)',
    content: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : "contains (identifying)"
    PRODUCT }o--o{ ORDER_ITEM : "appears in"
    CUSTOMER ||--o{ ADDRESS : "has multiple"

    CUSTOMER {
        int id PK "Customer ID"
        string first_name "First Name"
        string last_name "Last Name"
        string email "Email Address (Unique UQ)"
        varchar_20 phone_number "Phone Number (Optional)"
        datetime created_at "Registration Timestamp"
    }

    ADDRESS {
        int id PK "Address ID"
        int customer_id FK "Links to Customer"
        string street "Street Address"
        string city "City"
        string state_province "State/Province"
        varchar_10 postal_code "Postal Code"
        string country "Country"
        boolean is_default_shipping "Default Shipping"
        boolean is_default_billing "Default Billing"
    }

    PRODUCT {
        int id PK "Product ID"
        string name "Product Name (Unique UQ)"
        text description "Detailed Product Description"
        decimal_10_2 price "Unit Price (e.g., 99.99)"
        int stock_quantity "Available Stock"
        string sku "Stock Keeping Unit (Unique UQ)"
        datetime added_at "Date Added"
    }

    ORDER {
        int id PK "Order ID"
        int customer_id FK "Links to Customer"
        datetime order_date "Date of Order"
        varchar_50 status "Order Status (e.g., pending, shipped)"
        decimal_10_2 total_amount "Total Order Amount"
        int shipping_address_id FK "Shipping Address"
        int billing_address_id FK "Billing Address"
    }
    ORDER }o--|| ADDRESS : "ships to"
    ORDER }o--|| ADDRESS : "bills to"

    ORDER_ITEM {
        int order_id PK "Part of PK, Links to Order"
        int product_id PK "Part of PK, Links to Product"
        int quantity "Quantity Ordered"
        decimal_10_2 unit_price_at_purchase "Price at Time of Purchase"
    }
    %% Notes:
    %% - varchar_N and decimal_P_S are conceptual types, Mermaid uses 'string' and 'number' for rendering.
    %% - UQ (Unique) constraints are mentioned in comments for clarity.
`,
  },
  {
    label: 'Blogging Platform (ERD)',
    content: `erDiagram
    USER ||--o{ POST : "writes"
    USER ||--o{ COMMENT : "authors"
    POST ||--o{ COMMENT : "has many"
    POST ||--|{ POST_TAG : "tagged_in"
    TAG  ||--|{ POST_TAG : "references_tag"

    USER {
        int id PK "User ID"
        string username "Username (Unique UQ)"
        string email "Email (Unique UQ)"
        string password_hash "Hashed Password"
        datetime registered_at "Registration Date"
    }

    POST {
        int id PK "Post ID"
        int author_id FK "Author (User ID)"
        string title "Post Title"
        text content "Post Content"
        datetime created_at "Creation Timestamp"
        datetime updated_at "Last Update Timestamp"
        varchar_50 status "e.g., draft, published, archived"
    }

    COMMENT {
        int id PK "Comment ID"
        int post_id FK "Associated Post"
        int author_id FK "Author (User ID)"
        text content "Comment Text"
        datetime created_at "Creation Timestamp"
    }

    TAG {
        int id PK "Tag ID"
        string name "Tag Name (Unique UQ)"
    }

    POST_TAG {
        int post_id PK "Links to Post"
        int tag_id PK "Links to Tag"
    }
`,
  },
  {
    label: 'University System (ERD)',
    content: `erDiagram
    DEPARTMENT ||--o{ COURSE : "offers"
    DEPARTMENT ||--o{ PROFESSOR : "employs"
    PROFESSOR ||--o{ COURSE_SECTION : "teaches"
    COURSE ||--o{ COURSE_SECTION : "has sections"
    STUDENT ||--o{ ENROLLMENT : "enrolls in"
    COURSE_SECTION ||--o{ ENROLLMENT : "has enrolled"

    STUDENT {
        int student_id PK "Student ID"
        string first_name
        string last_name
        date date_of_birth
        string email "Unique Email UQ"
        int major_department_id FK "Major Department (Optional)"
    }
    STUDENT }o--|| DEPARTMENT : "majors in"

    PROFESSOR {
        int professor_id PK "Professor ID"
        string first_name
        string last_name
        string email "Unique Email UQ"
        int department_id FK "Primary Department"
        string office_location
    }

    DEPARTMENT {
        int department_id PK "Department ID"
        string name "Department Name (Unique UQ)"
        string building_code
    }

    COURSE {
        int course_id PK "Course ID"
        string course_code "e.g., CS101 (Unique UQ within Department)"
        string title "Course Title"
        text description
        int credits
        int department_id FK "Offering Department"
    }

    COURSE_SECTION {
        int section_id PK "Section ID"
        int course_id FK "Parent Course"
        int professor_id FK "Instructor"
        varchar_10 semester "e.g., Fall 2024"
        int year
        int capacity
        string room_number
    }

    ENROLLMENT {
        int student_id PK "Enrolled Student"
        int section_id PK "Enrolled Section"
        date enrollment_date
        varchar_2 grade "e.g., A, B+, IP (In Progress)"
    }
`,
  },
  {
    label: 'Social Network Lite (ERD)',
    content: `erDiagram
    USER ||--o{ POST : creates
    USER }o--o{ USER : "is_friends_with (many-to-many)"
    POST ||--o{ COMMENT : "has"
    USER ||--o{ COMMENT : "writes"
    USER ||--o{ LIKE : "gives"
    POST ||--o{ LIKE : "receives"

    USER {
        int id PK "User ID"
        string username "Unique Username UQ"
        string email "Unique Email UQ"
        string password_hash
        datetime created_at
    }

    POST {
        int id PK "Post ID"
        int user_id FK "Author ID"
        text content "Post content"
        datetime created_at
    }

    COMMENT {
        int id PK "Comment ID"
        int post_id FK "Post commented on"
        int user_id FK "Commenter ID"
        text content "Comment text"
        datetime created_at
    }

    LIKE {
        int user_id PK "Liker ID"
        int post_id PK "Liked Post ID"
        datetime created_at
    }
    %% Note: Friendship typically needs a separate junction table for M-N if attributes are needed for the friendship itself.
    %% Here, it's simplified. A real M-N friendship would be:
    %% FRIENDSHIP { int user_a_id PK FK, int user_b_id PK FK, string status }
    %% USER ||--|{ FRIENDSHIP : "initiates"
    %% USER ||--|{ FRIENDSHIP : "receives"
`,
  },
  {
    label: 'Task Management System (ERD)',
    content: `erDiagram
    PROJECT ||--o{ TASK : "contains"
    USER ||--o{ TASK : "assigned_to (optional)"
    USER ||--o{ COMMENT : "adds"
    TASK ||--o{ COMMENT : "has"
    TAG ||--o{ TASK_TAG : "used_in"
    TASK ||--o{ TASK_TAG : "has_tag"

    USER {
        int id PK
        string name
        string email UK
        datetime created_at
    }

    PROJECT {
        int id PK
        string name
        text description
        date start_date
        date end_date
        string status
    }

    TASK {
        int id PK
        int project_id FK
        int assigned_user_id FK
        string title
        text description
        string priority
        date due_date
        string status
        datetime created_at
        datetime updated_at
    }

    COMMENT {
        int id PK
        int task_id FK
        int user_id FK
        text content
        datetime created_at
    }

    TAG {
        int id PK
        string name UK
    }

    TASK_TAG {
        int task_id FK
        int tag_id FK
    }
`,
  }
];

interface ERDToolItem {
  label: string;
  mermaid: string;
  description?: string;
}

interface ERDToolCategory {
  categoryLabel: string;
  categoryIcon: JSX.Element;
  items: ERDToolItem[];
}

const ERD_TOOLS_CATEGORIES: ERDToolCategory[] = [
  {
    categoryLabel: 'Entity Tools',
    categoryIcon: <Shapes className="mr-2 h-4 w-4" />,
    items: [
      {
        label: 'Simple Entity',
        mermaid: 'NEW_ENTITY {\n    string attributeName "Description"\n    int anotherAttribute\n}',
        description: 'Adds a basic entity with a couple of attributes.',
      },
      {
        label: 'Standard Entity',
        mermaid: 'STANDARD_ENTITY {\n    int id PK "Primary Key"\n    string name "Entity Name"\n    text description "Optional description"\n    datetime created_at "Timestamp of creation"\n    datetime updated_at "Timestamp of last update"\n}',
        description: 'Adds an entity with ID, name, description, and timestamps.',
      },
      {
        label: 'Entity with Composite PK',
        mermaid: 'COMPOSITE_KEY_ENTITY {\n    int part1_id PK "Part 1 of PK"\n    int part2_id PK "Part 2 of PK"\n    string data\n}',
        description: 'Adds an entity with a composite Primary Key.',
      },
    ],
  },
  {
    categoryLabel: 'Attribute Tools',
    categoryIcon: <Type className="mr-2 h-4 w-4" />,
    items: [
      { label: 'String Attribute', mermaid: '    string newAttribute "Comment"', description: 'Adds a string type attribute.' },
      { label: 'Integer Attribute', mermaid: '    int count "Comment"', description: 'Adds an integer type attribute.' },
      { label: 'Text Attribute', mermaid: '    text details "Long text details"', description: 'Adds a text (long string) attribute.' },
      { label: 'Boolean Attribute', mermaid: '    boolean isActive "Activity status"', description: 'Adds a boolean type attribute.' },
      { label: 'Date Attribute', mermaid: '    date eventDate "Date of event"', description: 'Adds a date type attribute.' },
      { label: 'DateTime Attribute', mermaid: '    datetime timestampValue "Timestamp with time"', description: 'Adds a datetime attribute.' },
      { label: 'Decimal Attribute', mermaid: '    decimal amount "Decimal value e.g., 123.45"', description: "Conceptual decimal type (Mermaid uses 'number')." },
      { label: 'Varchar(N) Attribute', mermaid: '    varchar_100 short_string "String with max length 100"', description: "Conceptual varchar (Mermaid uses 'string')." },
      { label: 'Primary Key (PK)', mermaid: '    int id PK "Primary Key identifier"', description: 'Marks an attribute as a Primary Key.' },
      { label: 'Foreign Key (FK)', mermaid: '    int entity_id FK "Foreign Key reference"', description: 'Marks an attribute as a Foreign Key.' },
      { label: 'Unique Constraint (UQ)', mermaid: '    string email UQ "Unique email address (conceptual comment)"', description: 'Conceptual unique constraint (Mermaid uses comments for UQ).' },
      { label: 'Not Null Constraint (NN)', mermaid: '    string mandatory_field NN "This field cannot be null (conceptual comment)"', description: 'Conceptual not null constraint (Mermaid uses comments for NN).' },
      { label: 'Attribute with Default', mermaid: '    string status DEFAULT "pending" "Default value is pending (conceptual comment)"', description: 'Conceptual attribute with a default value (comment).' },
    ],
  },
  {
    categoryLabel: 'Relationship Tools',
    categoryIcon: <Link2 className="mr-2 h-4 w-4" />,
    items: [
      { label: 'One-to-Exactly-One (||--||)', mermaid: 'ENTITY1 ||--|| ENTITY2 : "label"', description: 'Exactly one to exactly one.' },
      { label: 'One-to-Zero-or-One (|o--o|)', mermaid: 'ENTITY1 |o--o| ENTITY2 : "label"', description: 'Zero or one to zero or one.' },
      { label: 'One-to-Many (||--o{)', mermaid: 'ENTITY1 ||--o{ ENTITY2 : "label"', description: 'Exactly one to zero or more.' },
      { label: 'One-to-One-or-More (||--|{)', mermaid: 'ENTITY1 ||--|{ ENTITY2 : "label (identifying)"', description: 'Exactly one to one or more (often identifying). Strong relationship.' },
      { label: 'Zero-or-One-to-Many (|o--o{)', mermaid: 'ENTITY1 |o--o{ ENTITY2 : "label"', description: 'Zero or one to zero or more.' },
      { label: 'Zero-or-One-to-One-or-More (|o--|{)', mermaid: 'ENTITY1 |o--|{ ENTITY2 : "label"', description: 'Zero or one to one or more.' },
      { label: 'Many-to-Many (}o--o{)', mermaid: 'ENTITY1 }o--o{ ENTITY2 : "label"', description: 'Zero or more to zero or more (requires linking table in practice).' },
      { label: 'Self-Referencing (Recursive)', mermaid: 'EMPLOYEE }o--o{ EMPLOYEE : "manages / reports_to"', description: 'Entity relates to itself (e.g., employee manages employee).'},
      { label: 'Generalization (ISA)', mermaid: 'VEHICLE <|-- CAR : "ISA"\n    VEHICLE <|-- TRUCK : "ISA"', description: 'Inheritance: CAR is a VEHICLE, TRUCK is a VEHICLE.'},
    ],
  },
  {
    categoryLabel: 'Diagram Directives',
    categoryIcon: <Settings2 className="mr-2 h-4 w-4" />,
    items: [
      { label: 'Comment', mermaid: '    %% This is a comment', description: 'Adds a comment to your Mermaid diagram.' },
      { label: 'Theme: Default', mermaid: "%%{init: {'theme': 'default'}}%%", description: "Sets diagram theme to Mermaid's default. Add at the very beginning." },
      { label: 'Theme: Neutral', mermaid: "%%{init: {'theme': 'neutral'}}%%", description: "Sets diagram theme to neutral. Add at the very beginning." },
      { label: 'Theme: Forest', mermaid: "%%{init: {'theme': 'forest'}}%%", description: "Sets diagram theme to forest (green tones). Add at the very beginning." },
      { label: 'Theme: Dark', mermaid: "%%{init: {'theme': 'dark'}}%%", description: "Sets diagram theme to dark. Add at the very beginning." },
      { label: 'Theme: Base', mermaid: "%%{init: {'theme': 'base'}}%%", description: "Sets diagram theme to base (for CSS variable customization). Add at the very beginning." },
      { label: 'Layout: Top-Down (TD)', mermaid: 'erDiagram TD', description: 'Changes diagram layout direction to Top-Down. Use this at the very beginning, replacing the default `erDiagram` line.'},
      { label: 'Layout: Left-to-Right (LR)', mermaid: 'erDiagram LR', description: 'Changes diagram layout direction to Left-to-Right. Use this at the very beginning, replacing the default `erDiagram` line.'},
      { label: 'Advanced Config Block', mermaid: "%% @config\n" +
      "{\n" +
      "  \"er\": {\n" +
      "    \"fontSize\": 12,\n" +
      "    \"entityColor\": \"#f9f9f9\",\n" +
      "    \"attributeTypeColor\": \"#888\"\n" +
      "  }\n" +
      "}\n" +
      "%%", description: "Adds a JSON configuration block for advanced styling. Place at the top."},
    ]
  },
];

const ManualEditorPage = () => {
  const { toast } = useToast();

  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);
  
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [generatedSql, setGeneratedSql] = useState<string | null>(null);
  const [sqlConversionError, setSqlConversionError] = useState<string | null>(null);
  const [isSqlDialogOpen, setIsSqlDialogOpen] = useState(false);
  const [isConvertingToSql, setIsConvertingToSql] = useState(false);

  // Function to get the next diagram number
  const getNextDiagramNumber = useCallback(() => {
    const existingNumbers = diagrams
      .map(d => {
        const match = d.name.match(/^ERD (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    if (existingNumbers.length === 0) {
      return 1; // Start from 1 if no existing diagrams
    }
    
    // Find the smallest missing number, or next sequential number
    existingNumbers.sort((a, b) => a - b);
    for (let i = 1; i <= existingNumbers.length + 1; i++) {
      if (!existingNumbers.includes(i)) {
        return i;
      }
    }
    return existingNumbers.length + 1;
  }, [diagrams]);

  useEffect(() => {
    if (diagrams.length === 0 && typeof window !== 'undefined') { 
      const newDiagramId = nanoid();
      const newDiagramName = `ERD 1`; // Always start with ERD 1
      const newDiagram: Diagram = {
        id: newDiagramId,
        name: newDiagramName,
        type: 'ER' as const, 
        content: DEFAULT_ERD_CONTENT,
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

    let currentCode = activeDiagram.content || MINIMAL_ERD_CONTENT;
    let lines = currentCode.split('\n');
    const snippetTrimmed = snippetToInsert.trim();
    const snippetLines = snippetTrimmed.split('\n').map(line => line.trimEnd()); // Trim only trailing spaces from snippet lines

    const isThemeDirective = snippetTrimmed.startsWith("%%{init: {'theme':");
    const isConfigDirective = snippetTrimmed.startsWith("%% @config");
    const isLayoutDirective = snippetTrimmed.match(/^erDiagram(\s+(TD|LR|RL|BT))?$/i);
    const isCommentDirective = snippetTrimmed.startsWith("%%") && !isThemeDirective && !isConfigDirective;

    // Remove existing identical directives
    if (isThemeDirective) {
        lines = lines.filter(line => !line.trim().startsWith("%%{init: {'theme':"));
    } else if (isConfigDirective) {
        let inConfigBlock = false;
        lines = lines.filter(line => {
            if (line.trim().startsWith("%% @config")) {
                inConfigBlock = true;
                return false; // Remove start line
            }
            if (inConfigBlock && line.trim().endsWith("%%")) {
                inConfigBlock = false;
                return false; // Remove end line and content
            }
            return !inConfigBlock; // Remove content lines
        });
    } else if (isLayoutDirective) {
        lines = lines.filter(line => !line.trim().match(/^erDiagram(\s+(TD|LR|RL|BT))?$/i));
    }
    
    // Consolidate lines and remove empty ones at the beginning/end
    lines = lines.map(l => l.trimEnd()).filter(l => l.trim() !== "");

    if (isThemeDirective || isConfigDirective || isLayoutDirective) {
        let directiveLines : string[] = [];
        let otherLines : string[] = [...lines]; // lines that are not directives being handled

        if(isThemeDirective) {
            directiveLines.push(snippetTrimmed);
            toast({ title: 'Theme Applied', description: `Set theme to: ${snippetTrimmed.match(/'([^']*)'/)?.[1] || 'selected'}` });
        } else { // If not current snippet, preserve existing theme if any
            const existingTheme = lines.find(line => line.trim().startsWith("%%{init: {'theme':"));
            if(existingTheme) directiveLines.push(existingTheme.trim());
            otherLines = otherLines.filter(line => !line.trim().startsWith("%%{init: {'theme':"));
        }
        
        if(isConfigDirective) {
            directiveLines.push(...snippetLines);
            toast({ title: 'Config Applied', description: 'Configuration block updated/added.' });
        } else {
            let existingConfigBlock: string[] = [];
            let inBlock = false;
            otherLines = otherLines.filter(line => {
                if (line.trim().startsWith("%% @config")) { inBlock = true; existingConfigBlock.push(line.trim()); return false;}
                if (inBlock && line.trim().endsWith("%%")) { inBlock = false; existingConfigBlock.push(line.trim()); return false;}
                if (inBlock) {existingConfigBlock.push(line.trim()); return false;}
                return true;
            });
            if(existingConfigBlock.length > 0) directiveLines.push(...existingConfigBlock);
        }

        if(isLayoutDirective) {
            directiveLines.push(snippetTrimmed);
            toast({ title: 'Layout Applied', description: `Diagram layout set to: ${snippetTrimmed}` });
        } else {
            const existingLayout = lines.find(line => line.trim().match(/^erDiagram(\s+(TD|LR|RL|BT))?$/i));
            if(existingLayout) directiveLines.push(existingLayout.trim());
            else directiveLines.push(MINIMAL_ERD_CONTENT.trim()); // Default if no layout found
            otherLines = otherLines.filter(line => !line.trim().match(/^erDiagram(\s+(TD|LR|RL|BT))?$/i));
        }
        
        lines = [...directiveLines, ...otherLines];

    } else { // General snippets and comments
        if (lines.length === 0) { // If editor was completely empty
            lines.push(MINIMAL_ERD_CONTENT.trim());
        }
        // Add a blank line if the last line is not empty and not an opening brace (for entities)
        // And not a comment
        if (lines.length > 0 && 
            lines[lines.length - 1].trim() !== "" && 
            !lines[lines.length - 1].trim().endsWith('{') &&
            !isCommentDirective) {
            lines.push(""); 
        }
        lines.push(...snippetLines);
        if (!isCommentDirective) { // Don't toast for comments
             toast({ title: 'Snippet Added', description: 'Mermaid code updated.' });
        }
    }
    
    let newCode = lines.join('\n');
    // Clean up multiple blank lines, but allow single blank lines
    newCode = newCode.replace(/\n\s*\n\s*\n/g, '\n\n'); 
    newCode = newCode.trimStart(); // Remove leading newlines/whitespace

    if (newCode.trim() === "") newCode = MINIMAL_ERD_CONTENT;

    handleMermaidCodeChange(newCode);
  };

  const loadExampleDiagram = (content: string) => {
    if (!activeDiagram) return;
    handleMermaidCodeChange(content);
    toast({ title: 'Example Loaded', description: 'Editor updated with example diagram.' });
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
    handleMermaidCodeChange(MINIMAL_ERD_CONTENT);
    toast({ title: 'Canvas Cleared', description: 'Ready for a new ER diagram.' });
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

  const handleCopySqlCode = async () => {
    if (!generatedSql) {
      toast({ title: 'Nothing to Copy', description: 'No SQL code available.', variant: 'destructive' });
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedSql);
      toast({ title: 'SQL Copied!', description: 'SQL code copied to clipboard.' });
    } catch (err) {
      console.error('Failed to copy SQL code: ', err);
      toast({ title: 'Copy Failed', description: 'Could not copy SQL code.', variant: 'destructive' });
    }
  };

  const processConvertToSQL = async () => {
    if (!activeDiagram || !mermaidCode.trim()) {
      toast({ title: 'Cannot Convert', description: 'Mermaid code is empty.', variant: 'destructive' });
      setSqlConversionError('Mermaid code is empty.');
      setGeneratedSql(null);
      setIsSqlDialogOpen(true);
      return;
    }
    setIsConvertingToSql(true);
    setGeneratedSql(null);
    setSqlConversionError(null);

    try {
      const result = await handleConvertToSql(mermaidCode);
      if (result.error) {
        setSqlConversionError(result.error);
        toast({ title: 'SQL Conversion Error', description: result.error, variant: 'destructive' });
      } else if (result.sqlCode) {
        setGeneratedSql(result.sqlCode);
        if (result.message) {
          toast({ title: 'SQL Conversion Successful', description: result.message });
        } else {
           toast({ title: 'SQL Conversion Successful' });
        }
      } else {
        setSqlConversionError('AI did not return SQL code or an error.');
        toast({ title: 'SQL Conversion Failed', description: 'AI did not return SQL code or an error.', variant: 'destructive' });
      }
    } catch (e: any) {
      console.error("Error calling handleConvertToSql:", e);
      setSqlConversionError(e.message || 'An unexpected error occurred.');
      toast({ title: 'SQL Conversion Error', description: e.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsConvertingToSql(false);
      setIsSqlDialogOpen(true);
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
    const nextNumber = getNextDiagramNumber();
    const newDiagramName = `ERD ${nextNumber}`;
    const newDiagram: Diagram = {
      id: newDiagramId,
      name: newDiagramName,
      type: 'ER' as const,
      content: DEFAULT_ERD_CONTENT,
    };
    setDiagrams((prevDiagrams) => [...prevDiagrams, newDiagram]);
    setActiveDiagramId(newDiagramId);
    toast({ title: 'New Tab Added', description: `${newDiagramName} created.` });
  }, [getNextDiagramNumber, toast]);

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
          // When creating the auto-replacement tab, use number 1
          const newId = nanoid();
          const newName = `ERD 1`;
          newDiagrams = [{ id: newId, name: newName, type: 'ER' as const, content: DEFAULT_ERD_CONTENT }];
        }
        return newDiagrams;
      });
      toast({ title: "Tab Closed", description: `${closedDiagramName} closed.` });
    },
    [toast]
  );

  const onTabChange = (id: string) => {
    setActiveDiagramId(id);
    setGeneratedSql(null);
    setSqlConversionError(null);
    setIsSqlDialogOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-sans animate-in fade-in duration-500">
      <header className="flex items-center justify-between p-3 border-b border-border shadow-sm bg-card">
        <h2 className="text-xl font-semibold text-foreground">ERD Editor</h2>
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
                ERD Tools & Examples
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
                  <DropdownMenuLabel>Select an Example ERD</DropdownMenuLabel>
                   <Separator className="my-1 bg-border -mx-1" />
                  {EXAMPLE_DIAGRAMS.map((ex) => (
                    <DropdownMenuItem key={ex.label} onClick={() => loadExampleDiagram(ex.content)}>
                      {ex.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator className="my-3 bg-border" /> 

              {ERD_TOOLS_CATEGORIES.map((category) => (
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={processConvertToSQL}
                    disabled={!mermaidCode.trim() || isConvertingToSql || !activeDiagram}
                  >
                    {isConvertingToSql ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-4 w-4" />
                    )}
                    Convert to SQL
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyMermaidCode} disabled={!mermaidCode.trim() || !activeDiagram}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Code
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-2 pt-0"> 
                {activeDiagram ? (
                  <Textarea
                    value={mermaidCode}
                    onChange={(e) => handleMermaidCodeChange(e.target.value)}
                    placeholder="erDiagram&#10;    CUSTOMER ||--o{ ORDER : places&#10;    CUSTOMER {&#10;        int id PK&#10;        string name&#10;        string email&#10;    }&#10;    ORDER {&#10;        int id PK&#10;        datetime orderDate&#10;        int customerId FK&#10;    }"
                    className="h-full w-full resize-none font-mono text-sm min-h-[150px]" // min-h for code editor
                    aria-label="Mermaid Code Editor"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select or create a diagram to start editing.
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

      <Dialog open={isSqlDialogOpen} onOpenChange={setIsSqlDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generated SQL Code</DialogTitle>
            <DialogDescription>
              {sqlConversionError
                ? "There was an error converting your Mermaid diagram to SQL."
                : "Review the generated SQL code. You can copy it to your clipboard."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 flex-grow overflow-hidden">
            {sqlConversionError ? (
              <Textarea
                readOnly
                value={`Error: ${sqlConversionError}`}
                className="w-full h-full flex-grow resize-none font-mono text-xs text-destructive min-h-[300px]"
                aria-label="SQL Conversion Error"
              />
            ) : generatedSql ? (
              <Textarea
                readOnly
                value={generatedSql}
                className="w-full h-full flex-grow resize-none font-mono text-xs min-h-[300px]"
                aria-label="Generated SQL Code"
              />
            ) : (
              <p className="text-muted-foreground">No SQL code generated or an unknown issue occurred.</p>
            )}
          </div>
          <DialogFooter className="mt-auto">
            {!sqlConversionError && generatedSql && (
                <Button variant="outline" onClick={handleCopySqlCode}>
                  <Copy className="mr-2 h-4 w-4" /> Copy SQL
                </Button>
            )}
            <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ManualEditorPage;
