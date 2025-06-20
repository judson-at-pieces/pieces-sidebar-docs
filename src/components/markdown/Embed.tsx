import React from 'react';

interface EmbedProps {
  src: string;
  title?: string;
  width?: string | number;
  height?: string | number;
}

export function Embed({ src, title, width = '100%', height = 400 }: EmbedProps) {
  // Extract video ID from YouTube URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(src);
  
  if (videoId) {
    // YouTube embed
    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title || 'YouTube video'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Generic iframe embed
  return (
    <iframe
      src={src}
      title={title || 'Embedded content'}
      width={width}
      height={height}
      className="rounded-lg border"
      frameBorder="0"
      allowFullScreen
    />
  );
}