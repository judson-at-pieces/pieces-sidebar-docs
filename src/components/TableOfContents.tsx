
import React from 'react';

interface TableOfContentsProps {
  activeSection: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ activeSection }) => {
  const tocItems = [
    { id: 'getting-to-know-pieces', title: 'Getting to Know Pieces' },
    { id: 'introducing-pieces', title: 'Introducing Pieces for Developers' },
    { id: 'what-is-pieces', title: 'What is Pieces?' },
    { id: 'who-is-pieces-for', title: 'Who is Pieces For?' },
    { id: 'how-do-i-use-pieces', title: 'How do I Use Pieces?' },
  ];

  return (
    <div className="w-64 bg-white border-l border-gray-200 h-[calc(100vh-60px)] overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">On this page</h3>
        <nav className="space-y-2">
          {tocItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="block text-sm text-blue-600 hover:text-blue-800 py-1"
            >
              {item.title}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TableOfContents;
