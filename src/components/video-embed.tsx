'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import { parseVideoUrl, getProviderDisplayName, type ParsedVideo } from '@/lib/video-utils';
import { Button } from '@/components/ui/button';
import { TiktokIcon } from './icons';
import { Instagram, Youtube } from 'lucide-react';

const retroButtonClass =
  'border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-200';

type VideoEmbedProps = {
  url: string | undefined;
  autoLoad?: boolean;
  autoPlay?: boolean;
};

function ProviderIcon({ provider }: { provider: ParsedVideo['provider'] }) {
  switch (provider) {
    case 'tiktok':
      return <TiktokIcon className="h-5 w-5" />;
    case 'instagram':
      return <Instagram className="h-5 w-5" />;
    case 'youtube':
      return <Youtube className="h-5 w-5" />;
    default:
      return <Play className="h-5 w-5" />;
  }
}

// TikTok Embed Component - matches the working example pattern
function TikTokEmbed({ videoId, url }: { videoId: string; url: string }) {
  // Extract username from URL if possible
  const usernameMatch = url.match(/@([\w.-]+)/);
  const username = usernameMatch ? usernameMatch[1] : 'user';

  return (
    <div className="flex justify-center w-full">
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId}
        style={{ maxWidth: '325px', minWidth: '325px' }}
      >
        <section>
          <a target="_blank" title={`@${username}`} href={`https://www.tiktok.com/@${username}?refer=embed`}>
            @{username}
          </a>
        </section>
      </blockquote>
      <Script async src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
    </div>
  );
}

// Instagram Embed Component - using direct iframe which is more reliable
function InstagramEmbed({ videoId, url }: { videoId: string; url: string }) {
  // Instagram iframe embed URL - works more reliably than blockquote + script
  const embedUrl = `https://www.instagram.com/reel/${videoId}/embed/`;

  return (
    <div className="flex justify-center w-full">
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <iframe
          src={embedUrl}
          style={{
            width: '100%',
            height: '600px',
            border: 'none',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          title="Instagram Reel"
        />
      </div>
    </div>
  );
}

// YouTube Embed Component - iframe with autoplay/loop params
function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="flex justify-center w-full">
      <div style={{ aspectRatio: '9/16', width: '100%', maxWidth: '325px' }}>
        <iframe
          style={{ width: '100%', height: '100%', borderRadius: '8px' }}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&rel=0`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export function VideoEmbed({ url, autoLoad = false }: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const parsedVideo = parseVideoUrl(url);

  // Auto-load the embed if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      setIsLoaded(true);
    }
  }, [autoLoad]);

  if (!parsedVideo || !parsedVideo.provider) {
    // Fallback for unsupported URLs - just show a link
    if (url) {
      return (
        <div className="flex items-center justify-center p-4 bg-secondary rounded-lg border-[3px] border-black">
          <Button asChild variant="outline" className={retroButtonClass}>
            <Link href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Video
            </Link>
          </Button>
        </div>
      );
    }
    return null;
  }

  const handleLoadEmbed = () => {
    setIsLoaded(true);
  };

  // Show "Click to load" button before loading the iframe
  if (!isLoaded) {
    return (
      <div className="relative w-full aspect-[9/16] max-h-[500px] bg-secondary rounded-lg border-[3px] border-black overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ProviderIcon provider={parsedVideo.provider} />
            <span className="font-bold">{getProviderDisplayName(parsedVideo.provider)}</span>
          </div>
          <Button onClick={handleLoadEmbed} className={retroButtonClass}>
            <Play className="h-4 w-4 mr-2" />
            Load Video
          </Button>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href={parsedVideo.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Open in {getProviderDisplayName(parsedVideo.provider)}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Render the appropriate native embed based on provider
  return (
    <div className="relative w-full bg-secondary rounded-lg border-[3px] border-black overflow-hidden p-4">
      {parsedVideo.provider === 'youtube' && parsedVideo.videoId && (
        <YouTubeEmbed videoId={parsedVideo.videoId} />
      )}

      {parsedVideo.provider === 'tiktok' && parsedVideo.videoId && (
        <TikTokEmbed videoId={parsedVideo.videoId} url={parsedVideo.url} />
      )}

      {parsedVideo.provider === 'instagram' && parsedVideo.videoId && (
        <InstagramEmbed videoId={parsedVideo.videoId} url={parsedVideo.url} />
      )}

      {/* Fallback link */}
      <div className="flex justify-center mt-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={parsedVideo.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3 mr-1" />
            Open in {getProviderDisplayName(parsedVideo.provider)}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * Compact video preview for showing in lists/grids
 */
type VideoPreviewProps = {
  url: string | undefined;
  onClick?: () => void;
};

export function VideoPreview({ url, onClick }: VideoPreviewProps) {
  const parsedVideo = parseVideoUrl(url);

  if (!parsedVideo || !parsedVideo.provider) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full border-[2px] border-black hover:bg-accent transition-colors"
    >
      <ProviderIcon provider={parsedVideo.provider} />
      <span className="text-sm font-bold">{getProviderDisplayName(parsedVideo.provider)}</span>
    </button>
  );
}
