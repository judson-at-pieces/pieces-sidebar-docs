
import { useEffect, useState } from 'react';
import { llmTextService } from '@/services/llmTextService';

export default function LLMTextFull() {
  const [content, setContent] = useState<string>('Generating full LLM content...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateContent = async () => {
      try {
        const { full } = await llmTextService.generateLLMText();
        setContent(full);
        
        // Set page title
        document.title = 'Pieces Documentation Full Content - llms-full.txt';
        
      } catch (error) {
        console.error('Failed to generate full LLM content:', error);
        setContent('Error: Failed to generate full documentation content');
      } finally {
        setLoading(false);
      }
    };

    generateContent();
  }, []);

  // For loading state, show minimal content
  if (loading) {
    return <pre>Generating full LLM content...</pre>;
  }

  // Return raw text as plain text
  return (
    <pre style={{ 
      fontFamily: 'monospace', 
      whiteSpace: 'pre-wrap', 
      margin: 0, 
      padding: '20px',
      backgroundColor: 'white',
      color: 'black',
      fontSize: '14px',
      lineHeight: '1.4'
    }}>
      {content}
    </pre>
  );
}
