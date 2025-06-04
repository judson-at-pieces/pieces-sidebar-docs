
import React from 'react';

const Typography = {
  H1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="hn-h1 text-4xl font-bold text-gray-900 mt-8 mb-6 border-b border-gray-200 pb-2">
      {children}
    </h1>
  ),

  H2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="hn-h2 text-3xl font-semibold text-gray-900 mt-10 mb-4">
      {children}
    </h2>
  ),

  H3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="hn-h3 text-2xl font-medium text-gray-900 mt-8 mb-3">
      {children}
    </h3>
  ),

  Paragraph: ({ children }: { children: React.ReactNode }) => (
    <p className="hn-paragraph text-gray-700 leading-relaxed mb-4 text-base">
      {children}
    </p>
  ),

  OrderedList: ({ children }: { children: React.ReactNode }) => (
    <ol className="hn-ordered-list list-decimal list-inside space-y-2 my-4 ml-4">
      {children}
    </ol>
  ),

  UnorderedList: ({ children }: { children: React.ReactNode }) => (
    <ul className="hn-unordered-list list-disc list-inside space-y-2 my-4 ml-4">
      {children}
    </ul>
  ),

  ListItem: ({ children }: { children: React.ReactNode }) => (
    <li className="hn-list-item text-gray-700 leading-relaxed">
      {children}
    </li>
  ),

  Blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="hn-blockquote border-l-4 border-gray-300 pl-6 italic text-gray-600 my-6 bg-gray-50 py-4 rounded-r-lg">
      {children}
    </blockquote>
  ),
};

export default Typography;
