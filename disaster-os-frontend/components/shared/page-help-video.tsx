"use client";

import { PlayCircle } from "lucide-react";
import {
  VideoModal,
  VideoModalContent,
  VideoModalDescription,
  VideoModalTitle,
  VideoModalTrigger,
  VideoModalVideo,
  VideoPlayButton,
  VideoPlayer,
  VideoPreview,
} from "@/components/ui/video-modal";
import { Button } from "@/components/ui/button";

interface PageHelpVideoProps {
  title: string;
  description: string;
  previewImage: string;
  videoSrc: string;
  triggerLabel?: string;
}

/**
 * Reusable help/tutorial video modal shown on every dashboard page.
 * Gives users a quick visual walkthrough of each feature without leaving
 * the page. Placed inline in page headers so it's always discoverable.
 */
export function PageHelpVideo({
  title,
  description,
  previewImage,
  videoSrc,
  triggerLabel = "Watch Tutorial",
}: PageHelpVideoProps) {
  return (
    <VideoModal>
      <VideoModalTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
        >
          <PlayCircle className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </VideoModalTrigger>
      <VideoModalContent>
        <VideoModalTitle>{title}</VideoModalTitle>
        <VideoModalDescription>{description}</VideoModalDescription>
        <VideoModalVideo>
          <VideoPlayer>
            <VideoPreview>
              <img
                src={previewImage}
                alt={`${title} preview`}
                className="h-full w-full object-cover"
              />
            </VideoPreview>
            <VideoPlayButton>
              <button className="absolute inset-0 m-auto flex size-24 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm transition duration-300 hover:bg-white/30">
                <PlayCircle className="size-14 stroke-1 text-white drop-shadow-lg" />
              </button>
            </VideoPlayButton>
            <iframe
              className="size-full"
              src={videoSrc}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </VideoPlayer>
        </VideoModalVideo>
      </VideoModalContent>
    </VideoModal>
  );
}
