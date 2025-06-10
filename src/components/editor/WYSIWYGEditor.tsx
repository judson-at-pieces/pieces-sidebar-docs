
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bold, Italic, List, Link, Image, Save } from 'lucide-react';
import { toast } from 'sonner';

interface WYSIWYGEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  isLocked?: boolean;
  lockedBy?: string | null;
}

export function WYSIWYGEditor({ 
  content, 
  onChange, 
  onSave, 
  isLocked = false, 
  lockedBy 
}: WYSIWYGEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerText = content;
    }
  }, [content]);

  const handleBoldClick = () => {
    insertAtCursor(`**${selectedText}**`);
  };

  const handleItalicClick = () => {
    insertAtCursor(`_${selectedText}_`);
  };

  const handleListClick = () => {
    insertAtCursor(`- ${selectedText}`);
  };

  const handleLinkClick = () => {
    setShowLinkDialog(true);
  };

  const handleImageClick = () => {
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl) {
      insertAtCursor(`![alt text](${imageUrl})`);
    }
  };

  const handleSaveClick = () => {
    if (onSave) {
      onSave();
    } else {
      toast.message('No save function provided');
    }
  };

  const insertLink = () => {
    if (!linkUrl || !selectedText) {
      toast.error('Please enter both link text and URL');
      return;
    }

    const linkMarkdown = `[${selectedText}](${linkUrl})`;
    insertAtCursor(linkMarkdown);
    setShowLinkDialog(false);
    setLinkUrl('');
    setSelectedText('');
  };

  const insertAtCursor = (text: string) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      
      // Update content
      const newContent = (editorRef.current as HTMLElement).innerText || '';
      onChange(newContent);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          WYSIWYG Editor
          {isLocked && lockedBy && (
            <Badge variant="secondary" className="ml-2">
              Locked by {lockedBy}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBoldClick}
            disabled={isLocked}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleItalicClick}
            disabled={isLocked}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleListClick}
            disabled={isLocked}
            title="List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleLinkClick}
            disabled={isLocked}
            title="Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleImageClick}
            disabled={isLocked}
            title="Image"
          >
            <Image className="h-4 w-4" />
          </Button>
          {onSave && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleSaveClick}
              disabled={isLocked}
              title="Save"
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div
          ref={editorRef}
          className="border rounded-md p-4 h-64 overflow-auto focus:outline-none"
          contentEditable={!isLocked}
          onSelect={handleTextSelection}
          style={{ whiteSpace: 'pre-wrap' }}
        />
        {showLinkDialog && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border rounded-md shadow-md p-4 w-96">
            <Label htmlFor="link-url">Link URL:</Label>
            <Input
              type="url"
              id="link-url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="mb-2"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowLinkDialog(false)}>
                Cancel
              </Button>
              <Button onClick={insertLink}>Insert Link</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
