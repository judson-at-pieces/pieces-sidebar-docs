
import React from 'react';
import { Link } from 'react-router-dom';
import { ExpandableImage } from '@/components/markdown/ExpandableImage';
import { Image } from '@/components/markdown/Image';
import { Callout } from '@/components/markdown/Callout';
import { Steps, Step } from '@/components/markdown/Steps';
import { MarkdownCard as Card } from '@/components/markdown/MarkdownCard';
import { CardGroup } from '@/components/markdown/CardGroup';
import { 
  CustomTable, 
  CustomTableHeader, 
  CustomTableBody, 
  CustomTableRow, 
  CustomTableHead, 
  CustomTableCell 
} from '@/components/markdown/CustomTable';
import { MDXProps } from '@/utils/mdxUtils';

export interface MDX_cliProps extends MDXProps {}

export const frontmatter = {
  "title": "Pieces CLI",
  "path": "/cli",
  "visibility": "PUBLIC"
};

// Export our wrapper component that uses EXACT SAME rendering as editor preview
export default function MDX_cli({ components = {} }: MDX_cliProps) {
  const _components = {
    a: ({ href, children, ...props }: any) => {
      if (href?.startsWith('/')) {
        return <Link to={href} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" {...props}>{children}</Link>;
      }
      return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" {...props}>{children}</a>;
    },
    table: CustomTable,
    thead: CustomTableHeader,
    tbody: CustomTableBody,
    tr: CustomTableRow,
    th: CustomTableHead,
    td: CustomTableCell,
    h1: ({ children, ...props }: any) => <h1 className="scroll-m-20 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight" {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 className="scroll-m-20 pb-2 text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight transition-colors first:mt-0" {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 className="scroll-m-20 pb-2 text-lg md:text-xl lg:text-2xl font-semibold tracking-tight transition-colors first:mt-0" {...props}>{children}</h3>,
    h4: ({ children, ...props }: any) => <h4 className="scroll-m-20 pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0" {...props}>{children}</h4>,
    pre: ({ children, ...props }: any) => <pre className="rounded-md border bg-secondary text-sm text-secondary-foreground" {...props}>{children}</pre>,
    code: ({ children, ...props }: any) => <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold" {...props}>{children}</code>,
    ul: ({ children, ...props }: any) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>{children}</ul>,
    ol: ({ children, ...props }: any) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>{children}</ol>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    blockquote: ({ children, ...props }: any) => <blockquote className="mt-6 border-l-2 pl-6 italic" {...props}>{children}</blockquote>,
    p: ({ children, ...props }: any) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>{children}</p>,
    hr: ({ ...props }: any) => <hr className="my-4 md:my-8" {...props} />,
    ExpandableImage,
    Image,
    Callout,
    Steps,
    Step,
    Card,
    CardGroup,
    ...components
  };
  
  return (
    <div className="space-y-6">
      <hr />
      <Image 
        src="https://storage.googleapis.com/hashnode_product_documentation_assets/cli_assets/CLI_MAIN/pieces_cli_banner.png" 
        alt="" 
        align="center" 
        fullwidth={true} 
      />
      <hr />
      
      <h2>Pieces CLI</h2>
      <p>The Pieces CLI offers users a straightforward way to manage and utilize saved code snippets through the Pieces Drive. It uses the AI-powered features of the Pieces Copilot, all directly within your terminal.</p>
      
      <ul>
        <li><Link to="/cli/copilot">Pieces Copilot</Link>: Utilize AI-driven conversations to enhance productivity by offering contextual assistance for your projects. It facilitates understanding of code, writing of comments, troubleshooting, and more by incorporating files and folders as context, with or without the powerful Long-Term Memory Engine (LTM-2).</li>
        <li><Link to="/cli/drive">Pieces Drive</Link>: Effortlessly save, find, and share your frequently used code snippets in your Pieces Drive. This makes organizing your work easy, allows for quick access to the code you need, and facilitates effective collaboration with others.</li>
      </ul>
      
      <CardGroup cols={2}>
        <Card 
          title="Getting Started" 
          image="https://cdn.hashnode.com/res/hashnode/image/upload/v1745331342247/687c66b0-ac65-412f-a9e0-39e6ac00c93b.png"
        >
          Follow <Link to="/cli/get-started">these instructions</Link> on how to download and install the Pieces CLI.
        </Card>
        <Card 
          title="Support & Troubleshooting" 
          image="https://cdn.hashnode.com/res/hashnode/image/upload/v1745331350108/c3c9ac64-c629-447a-a8fc-307d1f8f297b.webp"
        >
          Explore <Link to="/cli/troubleshooting">troubleshooting options</Link>, navigate to our support page, or <a target="_blank" href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ22WJ2Htd2wRMJhueCNYc0xbFBFCAN-khijcuoXACd_Uux3wIhgZeGkzDRcqD3teamAI-CwCHpr">directly book a call</a> with our engineers.
        </Card>
      </CardGroup>
      
      <Card 
        title="Learn More with Quick Guides" 
        image="https://cdn.hashnode.com/res/hashnode/image/upload/v1747065928779/0f8466fc-9daf-4c91-87ba-f596cd1cd6d3.png"
      >
        Pieces Quick Guides help you quickly understand and effectively utilize powerful features like the Long-Term (LTM-2) Memory Engine and Pieces Copilot. <Link to="/quick-guides/overview">Click here to get started.</Link>
      </Card>
      
      <p>This software is designed to provide two main features: AI Assistance with the Pieces Copilot and developer material management within the Pieces Drive.</p>
      
      <h3>Enhanced AI Assistance</h3>
      <p>Through the Pieces CLI, developers can boost productivity by having AI-driven conversations that use <Link to="/cli/copilot/chat">relevant notes and folders as context</Link>, all within their terminal.</p>
      
      <Image 
        src="https://storage.googleapis.com/hashnode_product_documentation_assets/cli_assets/pieces_copilot/chat/pieces_context_chat.gif" 
        alt="" 
        align="center" 
        fullwidth={false} 
      />
      
      <h3>Integrated Snippet Management</h3>
      <p>With Pieces Drive and PiecesOS in their terminal, developers can <Link to="/cli/drive">save, search, and share their code snippets</Link>. This enhances productivity by making reusable code accessible and organized within their notes and project files.</p>
      
      <Image 
        src="https://storage.googleapis.com/hashnode_product_documentation_assets/cli_assets/CLI_MAIN/pieces_drive_list.png" 
        alt="" 
        align="center" 
        fullwidth={true} 
      />
      
      <h2>Using Pieces Copilot</h2>
      <p>The Pieces CLI enhances your workflow by letting you save, manage, and share snippets in the terminal. It offers features like snippet enrichment, sharing via custom links, and seamless integration with your development environment.</p>
      
      <p>To explore available options, run `pieces help` within your terminal.</p>
      
      <p>From here, you'll find several actions, including:</p>
      
      <ul>
        <li>`Edit`: <Link to="/cli/drive/edit-and-update">Change the name and classification of the material</Link> within Pieces Drive from directly within the terminal.</li>
        <li>`Create and Delete`: Pieces CLI allows you to <Link to="/cli/drive/saving-materials">manage your snippets easily from within your terminal</Link>, allowing you to create and delete snippets.</li>
      </ul>
      
      <Image 
        src="https://storage.googleapis.com/hashnode_product_documentation_assets/cli_assets/CLI_MAIN/edit_command.png" 
        alt="" 
        align="center" 
        fullwidth={true} 
      />
      
      <h2>Managing Your Code Snippets</h2>
      <p>Saving and managing materials with the Pieces CLI is done with lightweight and familiar terminal-style commands.</p>
      
      <p>To save a snippet, copy a section of text or code to your clipboard, head over to Pieces CLI, and type `pieces create`. If you're in `pieces run` mode, you can just type `create`.</p>
      
      <Callout type="tip">
        Common snippet types include utility functions, API requests, and reusable code blocks.
      </Callout>
      
      <p>When you save snippets to your Pieces Drive with Pieces CLI, they get AI-generated metadata like <Link to="/cli/drive/save-snippets#whats-stored-when-you-save-a-snippet">tags, titles, authorship details, and descriptions</Link>. This keeps everything organized and easy to access and use at any point.</p>
      
      <Image 
        src="https://storage.googleapis.com/hashnode_product_documentation_assets/cli_assets/CLI_MAIN/snippet_content.png" 
        alt="" 
        align="center" 
        fullwidth={true} 
      />
      
      <h3>Referencing & Reusing</h3>
      <p>Pieces CLI provides you with powerful search tools to quickly find and access your snippets that you previously saved to Pieces Drive.</p>
      
      <p>There are three different search methods: Fuzzy Search, Neural Code Search, and Full Text Search.</p>
      
      <p>To search for snippets, while Pieces CLI is open, type `search "query"`.</p>
      
      <p>You can also opt-in to using Neural Code Search with `—mode ncs` or Full Text Search with `—mode fts`.</p>
      
      <Callout type="info">
        Your query must be encapsulated in quotations for Pieces CLI to capture your full prompt
      </Callout>
      
      <p>A new terminal window will open and you'll be presented with a list of materials that closely match your query.</p>
      
      <p>Scroll down or up with the `arrow keys` and select the material by pressing `enter`. The material will display with its attributes and the code that was stored in the material.</p>
      
      <Image 
        src="https://storage.googleapis.com/hashnode_product_documentation_assets/cli_assets/CLI_MAIN/ncs_search_results.png" 
        alt="" 
        align="center" 
        fullwidth={true} 
      />
      
      <hr />
      
      <p>Download the Pieces CLI and follow our <Link to="/cli/get-started">installation guide</Link> to start streamlining your workflow!</p>
    </div>
  );
}

MDX_cli.displayName = 'MDX_cli';
MDX_cli.frontmatter = frontmatter;
