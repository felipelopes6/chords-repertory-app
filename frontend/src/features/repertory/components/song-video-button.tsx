'use client';

import {
  faExpand,
  faHeadphones,
  faMinimize,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

type SongVideoButtonProps = {
  artist: string;
  songName: string;
  youtubeUrl: string | null;
};

export function SongVideoButton({
  artist,
  songName,
  youtubeUrl,
}: SongVideoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeUrl);

  if (!youtubeEmbedUrl) {
    return null;
  }

  return (
    <>
      <button
        aria-label={`Ouvir ${songName} no YouTube`}
        className='mt-1 flex h-10 shrink-0 items-center gap-2 rounded-[10px] border border-[#B4432E]/15 bg-white px-3 text-sm font-bold text-[#B4432E] shadow-sm transition hover:border-[#B4432E]/30 hover:bg-[#FDF8F2] focus:outline-none focus:ring-2 focus:ring-[#B4432E]/25'
        onClick={() => {
          setIsCompact(false);
          setIsOpen(true);
        }}
        title='Ouvir'
        type='button'
      >
        <FontAwesomeIcon
          aria-hidden='true'
          className='h-4.5 w-4.5'
          icon={faHeadphones}
        />
        <span>Ouvir</span>
      </button>

      {isOpen ? (
        <ListenModal
          artist={artist}
          isCompact={isCompact}
          onClose={() => setIsOpen(false)}
          onToggleCompact={() => setIsCompact((current) => !current)}
          songName={songName}
          youtubeEmbedUrl={youtubeEmbedUrl}
        />
      ) : null}
    </>
  );
}

function ListenModal({
  artist,
  isCompact,
  onClose,
  onToggleCompact,
  songName,
  youtubeEmbedUrl,
}: {
  artist: string;
  isCompact: boolean;
  onClose: () => void;
  onToggleCompact: () => void;
  songName: string;
  youtubeEmbedUrl: string;
}) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', closeOnEscape);

    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      aria-labelledby='listen-modal-title'
      aria-modal={!isCompact}
      className={
        isCompact
          ? 'fixed bottom-3 right-3 z-50 w-[min(260px,calc(100vw-24px))] sm:bottom-5 sm:right-5 sm:w-[360px]'
          : 'fixed inset-0 z-50 flex items-center justify-center bg-[#2C2926]/70 px-4 py-6'
      }
      onClick={isCompact ? undefined : onClose}
      role='dialog'
    >
      <div
        className={`w-full overflow-hidden bg-white shadow-2xl ${
          isCompact
            ? 'rounded-[14px] border border-[#6B3E21]/10'
            : 'max-w-3xl rounded-[16px]'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between border-b border-[#6B3E21]/10 ${
            isCompact ? 'gap-2 px-2.5 py-2' : 'items-start gap-4 p-4 sm:p-5'
          }`}
        >
          <div className='min-w-0'>
            {isCompact ? null : (
              <p className='text-xs font-bold uppercase tracking-[0.16em] text-[#6B3E21]/45'>
                Ouvir
              </p>
            )}
            <h2
              className={`truncate font-bold text-[#6B3E21] ${
                isCompact ? 'text-xs' : 'mt-1 text-xl'
              }`}
              id='listen-modal-title'
            >
              {songName}
            </h2>
            <p
              className={`mt-1 truncate font-semibold text-[#6B3E21]/65 ${
                isCompact ? 'text-xs' : 'text-sm'
              }`}
            >
              {artist}
            </p>
          </div>

          <div className='flex shrink-0 items-center gap-2'>
            <button
              aria-label={
                isCompact ? 'Aumentar vídeo' : 'Diminuir vídeo'
              }
              className={`flex items-center justify-center rounded-[10px] border border-[#6B3E21]/15 text-[#6B3E21] transition hover:bg-[#FDF8F2] ${
                isCompact ? 'h-8 w-8' : 'h-9 w-9'
              }`}
              onClick={onToggleCompact}
              type='button'
            >
              <FontAwesomeIcon
                aria-hidden='true'
                className='h-3.5 w-3.5'
                icon={isCompact ? faExpand : faMinimize}
              />
            </button>

            <button
              aria-label='Fechar vídeo'
              className={`flex items-center justify-center rounded-[10px] border border-[#6B3E21]/15 text-[#6B3E21] transition hover:bg-[#FDF8F2] ${
                isCompact ? 'h-8 w-8' : 'h-9 w-9'
              }`}
              onClick={onClose}
              type='button'
            >
              <FontAwesomeIcon
                aria-hidden='true'
                className='h-4 w-4'
                icon={faXmark}
              />
            </button>
          </div>
        </div>

        <div className='bg-black'>
          <iframe
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            allowFullScreen
            className='aspect-video w-full'
            referrerPolicy='strict-origin-when-cross-origin'
            src={youtubeEmbedUrl}
            title={`${songName} - ${artist}`}
          />
        </div>
      </div>
    </div>
  );
}

function getYouTubeEmbedUrl(youtubeUrl: string | null) {
  if (!youtubeUrl) {
    return null;
  }

  try {
    const url = new URL(youtubeUrl);
    const normalizedHostname = url.hostname.replace(/^www\./, '');

    if (normalizedHostname === 'youtu.be') {
      const videoId = url.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (
      normalizedHostname === 'youtube.com' ||
      normalizedHostname === 'm.youtube.com'
    ) {
      const videoId =
        url.pathname.startsWith('/embed/')
          ? url.pathname.split('/').filter(Boolean)[1]
          : url.searchParams.get('v');

      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}
