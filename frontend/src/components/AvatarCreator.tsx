"use client";

import { useEffect, useRef, useState } from "react";

interface AvatarCreatorProps {
  onAvatarExported: (url: string) => void;
}

export function AvatarCreator({ onAvatarExported }: AvatarCreatorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscribe = (event: MessageEvent) => {
      // Basic origin check for security (can be refined if RPM domain is specific)
      try {
        let json = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        
        if (json?.source !== "readyplayerme") return;
        
        // When iframe is ready
        if (json.eventName === "v1.frame.ready") {
          setLoading(false);
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({
              target: "readyplayerme",
              type: "subscribe",
              eventName: "v1.**"
            }),
            "*"
          );
        }
        
        // When avatar is done
        if (json.eventName === "v1.avatar.exported") {
          onAvatarExported(json.data.url);
        }
      } catch (err) {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener("message", subscribe);
    return () => window.removeEventListener("message", subscribe);
  }, [onAvatarExported]);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="https://demo.readyplayer.me/avatar?frameApi"
        className="w-full h-full border-none"
        allow="camera *; microphone *; clipboard-write"
      />
    </div>
  );
}
