---
title: "Component Test Page - Fixed"
path: "/desktop/TESTPAGE-FIXED"
visibility: "PUBLIC"
---

# Component Test Page - Fixed

This page contains examples of all available components with corrected syntax for testing the markdown renderer.

---

## Basic Typography

This is a paragraph with **bold text**, *italic text*, and ***bold italic text***.

Here's a [link to Pieces](https://pieces.app) and a link that opens in a new tab.

### Lists

#### Unordered List
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

#### Ordered List
1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

---

## Images

### Basic Image
<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/mcp_documentation/mcp_gh_copilot/mcp-2-1.png" alt="Basic image example" />

### Centered Image
<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/mcp_documentation/mcp_gh_copilot/mcp-2-1.png" alt="Centered image" align="center" />

### Full Width Image
<Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/mcp_documentation/mcp_gh_copilot/mcp-2-1.png" alt="Full width image" align="center" fullwidth="true" />

---

## Code Blocks

### Inline Code
Use `pieces login` to authenticate with Pieces.

### Basic Code Block
```
This is a basic code block without syntax highlighting
```

### JavaScript Code
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet('Pieces User');
```

### Python Code
```python
def greet(name):
    print(f"Hello, {name}!")

greet("Pieces User")
```

### JSON Code
```json
{
  "name": "Pieces",
  "version": "1.0.0",
  "features": ["snippets", "copilot", "sharing"]
}
```

---

## Callouts

<Callout type="info">
  This is an **info** callout with some important information. It supports *markdown* formatting.
</Callout>

<Callout type="tip">
  This is a **tip** callout with a helpful suggestion. You can include `code` and [links](https://pieces.app).
</Callout>

<Callout type="alert">
  This is an **alert** callout for warnings or important notices. Pay attention to this!
</Callout>

---

## Cards

### Single Card
<Card title="Getting Started" image="https://storage.googleapis.com/hashnode_product_documentation_assets/mcp_documentation/mcp_pfd_new.png">
  Learn how to get started with Pieces and boost your productivity.
</Card>

### Card with Link
<Card title="Documentation" href="https://docs.pieces.app" target="_blank">
  Explore our comprehensive documentation to learn more about Pieces.
</Card>

### Card Group (2 columns)
<CardGroup cols={2}>
  <Card title="Desktop App" image="https://storage.googleapis.com/hashnode_product_documentation_assets/mcp_documentation/mcp_pfd_new.png">
    Download and install the Pieces Desktop App for your operating system.
  </Card>
  <Card title="VS Code Extension" image="https://storage.googleapis.com/hashnode_product_documentation_assets/mcp_documentation/mcp_gh_copilot/mcp_add_server_dropdown.png">
    Install the Pieces extension for Visual Studio Code.
  </Card>
</CardGroup>

### Card Group (3 columns)
<CardGroup cols={3}>
  <Card title="Save Snippets">
    Save code snippets with one click
  </Card>
  <Card title="AI Copilot">
    Get AI-powered code assistance
  </Card>
  <Card title="Share Code">
    Share code with your team easily
  </Card>
</CardGroup>

---

## Steps

### Basic Steps
<Steps>
  <Step title="Install Pieces">
    Download and install Pieces for your operating system.
  </Step>
  <Step title="Create Account">
    Sign up for a free Pieces account to sync your data.
  </Step>
  <Step title="Start Coding">
    Begin saving and managing your code snippets!
  </Step>
</Steps>

### Steps with Rich Content
<Steps>
  <Step title="Download Pieces">
    First, download the Pieces Desktop App from our website.
    
    <Image src="https://storage.googleapis.com/hashnode_product_documentation_assets/mcp_documentation/mcp_pfd_new.png" alt="Download page" align="center" />
  </Step>
  
  <Step title="Configure Settings">
    Open the settings and configure your preferences.
    
    ```json
    {
      "theme": "dark",
      "autoSave": true,
      "syncEnabled": true
    }
    ```
    
    <Callout type="tip">
      We recommend enabling auto-save to never lose your snippets!
    </Callout>
  </Step>
  
  <Step title="Connect Your IDE">
    Install the Pieces plugin for your favorite IDE:
    
    - **VS Code**: Search for "Pieces" in extensions
    - **JetBrains**: Find "Pieces" in the plugin marketplace
    - **Visual Studio**: Download from the Visual Studio Marketplace
    
    <Callout type="alert">
      Make sure PiecesOS is running before connecting your IDE!
    </Callout>
  </Step>
</Steps>

---

## Tabs

<Tabs>
  <TabItem title="macOS">
    ### Installation on macOS
    
    1. Download the `.dmg` file
    2. Open the downloaded file
    3. Drag Pieces to Applications
    
    ```bash
    # Verify installation
    pieces --version
    ```
  </TabItem>
  
  <TabItem title="Windows">
    ### Installation on Windows
    
    1. Download the `.exe` installer
    2. Run the installer
    3. Follow the setup wizard
    
    ```powershell
    # Verify installation
    pieces --version
    ```
  </TabItem>
  
  <TabItem title="Linux">
    ### Installation on Linux
    
    1. Download the AppImage
    2. Make it executable
    3. Run the AppImage
    
    ```bash
    chmod +x Pieces.AppImage
    ./Pieces.AppImage
    ```
  </TabItem>
</Tabs>

---

## Accordions

### Single Accordion
<Accordion title="What is Pieces?" defaultOpen={true}>
  Pieces is a developer productivity tool that helps you save, organize, and share code snippets. It includes AI-powered features to enhance your coding workflow.
</Accordion>

### Accordion Group (Single Open)
<AccordionGroup>
  <Accordion title="Features">
    - Save code snippets with one click
    - AI-powered code generation
    - Smart code search
    - Team collaboration
  </Accordion>
  
  <Accordion title="Supported Languages">
    Pieces supports over 40 programming languages including:
    - JavaScript/TypeScript
    - Python
    - Java
    - C++
    - Go
    - Rust
    - And many more!
  </Accordion>
  
  <Accordion title="Pricing">
    Pieces offers a free tier with generous limits and paid plans for teams and enterprises.
  </Accordion>
</AccordionGroup>

### Accordion Group (Multiple Open)
<AccordionGroup allowMultiple={true}>
  <Accordion title="Getting Started" defaultOpen={true}>
    1. Download Pieces
    2. Install the app
    3. Connect your IDE
    4. Start saving snippets!
  </Accordion>
  
  <Accordion title="Advanced Features" defaultOpen={true}>
    - Long-term memory
    - Context awareness
    - Smart recommendations
    - Code transformations
  </Accordion>
</AccordionGroup>

---

## Tables

### Basic Table
<Table 
  headers={["Feature", "Free", "Pro", "Enterprise"]}
  rows={[
    ["Snippets", "100", "Unlimited", "Unlimited"],
    ["AI Queries", "50/day", "500/day", "Unlimited"],
    ["Team Members", "1", "10", "Unlimited"],
    ["Support", "Community", "Priority", "Dedicated"]
  ]}
/>

### Complex Table with Markdown Content
| Component | Description | Example Usage |
|-----------|-------------|---------------|
| `<Callout>` | Highlighted information boxes | `<Callout type="info">Message</Callout>` |
| `<Steps>` | Step-by-step instructions | `<Steps><Step title="...">Content</Step></Steps>` |
| `<Card>` | Content cards with images | `<Card title="..." image="...">Content</Card>` |
| `<Tabs>` | Tabbed content | `<Tabs><TabItem title="...">Content</TabItem></Tabs>` |

---

## Buttons

<Button label="Get Started" linkHref="/getting-started" align="center" />

<Button label="Download Pieces" linkHref="https://pieces.app/download" openLinkInNewTab={true} align="left" />

<Button label="View Documentation" linkHref="/docs" align="right" lightColor="#3B82F6" darkColor="#60A5FA" />

---

## Nested Components Examples

### Callouts Inside Steps
<Steps>
  <Step title="Important Configuration">
    Before proceeding, make sure to configure your environment properly.
    
    <Callout type="alert">
      This step is **critical** for proper functionality. Do not skip it!
    </Callout>
    
    Run the following command:
    ```bash
    pieces config --set api.key YOUR_API_KEY
    ```
  </Step>
  
  <Step title="Multiple Callouts">
    This step contains multiple callouts for different purposes.
    
    <Callout type="info">
      This is general information about the process.
    </Callout>
    
    <Callout type="tip">
      Here's a helpful tip to make things easier!
    </Callout>
    
    <Callout type="alert">
      And this is a warning about potential issues.
    </Callout>
  </Step>
</Steps>

### Cards Inside Tabs
<Tabs>
  <TabItem title="Downloads">
    <CardGroup cols={2}>
      <Card title="macOS" image="https://storage.googleapis.com/hashnode_product_documentation_assets/mcp_documentation/mcp_pfd_new.png">
        Download for macOS (Intel & Apple Silicon)
      </Card>
      <Card title="Windows" image="https://storage.googleapis.com/hashnode_product_documentation_assets/mcp_documentation/mcp_pfd_new.png">
        Download for Windows 10/11
      </Card>
    </CardGroup>
  </TabItem>
  
  <TabItem title="Extensions">
    <CardGroup cols={3}>
      <Card title="VS Code">
        Install from VS Code Marketplace
      </Card>
      <Card title="JetBrains">
        Available in Plugin Repository
      </Card>
      <Card title="Visual Studio">
        Get from Visual Studio Marketplace
      </Card>
    </CardGroup>
  </TabItem>
</Tabs>

### Complex Nested Structure
<AccordionGroup allowMultiple={true}>
  <Accordion title="Installation Guide" defaultOpen={true}>
    <Steps>
      <Step title="Choose Your Platform">
        Select your operating system:
        
        <Tabs>
          <TabItem title="macOS">
            <Callout type="info">
              Requires macOS 10.15 or later
            </Callout>
            
            Download the `.dmg` file and follow the installer.
          </TabItem>
          
          <TabItem title="Windows">
            <Callout type="info">
              Requires Windows 10 version 1903 or later
            </Callout>
            
            Download the `.exe` installer.
          </TabItem>
        </Tabs>
      </Step>
      
      <Step title="Verify Installation">
        After installation, verify everything is working:
        
        ```bash
        pieces --version
        pieces doctor
        ```
        
        <Callout type="tip">
          If you encounter issues, check our troubleshooting guide!
        </Callout>
      </Step>
    </Steps>
  </Accordion>
  
  <Accordion title="Configuration Options">
    <Table 
      headers={["Setting", "Default", "Description"]}
      rows={[
        ["theme", "system", "UI theme (light/dark/system)"],
        ["autoStart", "true", "Start Pieces on system boot"],
        ["telemetry", "false", "Send anonymous usage data"]
      ]}
    />
  </Accordion>
</AccordionGroup>

---

## Horizontal Rules

Standard horizontal rule:

---

Multiple horizontal rules:

---

---

---

## Edge Cases and Stress Tests

### Very Long Code Block
```javascript
// This is a very long code block to test horizontal scrolling
const veryLongVariableNameThatShouldCauseHorizontalScrollingInTheCodeBlockToTestTheRenderingBehavior = "This is a test of how the code block handles very long lines of code that extend beyond the normal viewport width";

function anotherLongFunctionNameToTestScrolling(parameterOne, parameterTwo, parameterThree, parameterFour, parameterFive) {
  return parameterOne + parameterTwo + parameterThree + parameterFour + parameterFive;
}
```

### Deeply Nested Lists
1. Level 1
   1. Level 2
      1. Level 3
         1. Level 4
            - Mixed list type
            - Another item
         2. Back to level 4
      2. Back to level 3
   2. Back to level 2
2. Back to level 1

### Empty Components
<Callout type="info"></Callout>

<Card title="Empty Card"></Card>

<Steps>
  <Step title="Empty Step"></Step>
</Steps>

---

## All Callout Types in Steps

<Steps>
  <Step title="Testing All Callout Types">
    Let's test every callout type inside a step:
    
    <Callout type="info">
      This is an **info** callout inside a step.
    </Callout>
    
    <Callout type="tip">
      This is a **tip** callout inside a step.
    </Callout>
    
    <Callout type="alert">
      This is an **alert** callout inside a step.
    </Callout>
    
    And here's some code too:
    ```python
    print("Hello from inside a step!")
    ```
  </Step>
</Steps>

---

## Mixed Content in Cards

<CardGroup cols={2}>
  <Card title="Card with Code">
    This card contains a code snippet:
    
    ```javascript
    console.log("Hello from a card!");
    ```
  </Card>
  
  <Card title="Card with List">
    This card contains a list:
    - First item
    - Second item
    - Third item
  </Card>
</CardGroup>

---

## End of Test Page

This page contains examples of all available components and common nesting patterns. Use this as a reference for testing the markdown renderer.