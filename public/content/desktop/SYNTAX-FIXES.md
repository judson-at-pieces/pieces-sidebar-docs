---
title: "Component Syntax Fixes"
path: "/desktop/SYNTAX-FIXES"
visibility: "PUBLIC"
---

# Component Syntax Fixes

## Issues Found and Fixed

### 1. TableOfContents Component
**Issue**: The TableOfContents component was being used incorrectly with manual content.

**Original (incorrect)**:
```jsx
<TableOfContents content={`
# Table of Contents
- [Introduction](#introduction)
- [Getting Started](#getting-started)
`} />
```

**Fix**: TableOfContents is designed to automatically extract headings from the page content. It's typically added automatically by the page renderer, not manually in markdown. For testing, I replaced it with a manual table of contents using standard markdown links.

### 2. Missing Components
The following components were referenced but might not be available in the component mappings:
- `<Embed>` - For embedding YouTube videos
- `<ExpandableImage>` - For expandable images
- `<NewTab>` - For links that open in new tabs
- `<GlossaryAll>` - For displaying glossary

**Fix**: These components need to be registered in `componentMappings.tsx` if they're to be used in markdown.

### 3. Component Syntax Rules

#### Self-closing components:
```jsx
<Image src="..." alt="..." />
<Embed src="..." />
```

#### Container components with children:
```jsx
<Callout type="info">
  Content here
</Callout>

<Steps>
  <Step title="Title">
    Content here
  </Step>
</Steps>
```

#### Components with numeric props:
```jsx
<CardGroup cols={2}>  // Note: curly braces for numbers
  <Card>...</Card>
</CardGroup>
```

#### Boolean props:
```jsx
<Accordion defaultOpen={true}>  // Note: curly braces for booleans
<Image fullwidth="true" />      // Or as string
```

### 4. Nested Components
Nested components work fine, but ensure proper indentation and closing tags:

```jsx
<Steps>
  <Step title="Step with nested content">
    Some text here
    
    <Callout type="alert">
      Warning message
    </Callout>
    
    ```javascript
    // Code block inside step
    console.log("Hello");
    ```
    
    <Image src="..." alt="..." />
  </Step>
</Steps>
```

### 5. Special Components That Might Not Work
These components were in the test page but may not be implemented:
- `<pos-download-guide />` - Custom component for OS-specific downloads
- `<get-started-install />` - Custom installation guide component

These appear to be custom components specific to the Pieces documentation and would need separate implementation.

### 6. Table of Contents Alternative
Since TableOfContents is typically auto-generated, for manual navigation use standard markdown links:

```markdown
## On This Page
- [Section 1](#section-1)
- [Section 2](#section-2)
  - [Subsection](#subsection)
```

## Testing the Fixed Page

The corrected test page is now available at:
- `/desktop/TESTPAGE-FIXED`

This version has all syntax errors fixed and should render properly with the current component setup.