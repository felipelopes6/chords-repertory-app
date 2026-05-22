'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { AppToast } from '@/components/ui/toast';

import { updateSongKeyOffset } from '../api';
import type { ChordSegment, SongDetails } from '../types';
import {
  formatKeyOffset,
  isChordToken,
  isSectionToken,
  transposeCifra,
  transposeChordText,
  transposeKey,
} from '../lib/transpose';

type ChordViewerProps = {
  details: SongDetails;
  initialOffset?: number;
  repertoryId?: string;
  songId?: string;
};

const tokenKey = 'music-repertory-token';
const defaultFontSize = 16;
const minFontSize = 13;
const maxFontSize = 24;

export function ChordViewer({
  details,
  initialOffset = 0,
  repertoryId,
  songId,
}: ChordViewerProps) {
  const [keyOffset, setKeyOffset] = useState(initialOffset);
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [message, setMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lines = transposeCifra(details.cifra, keyOffset);
  const currentKey = transposeKey(details.originalKey, keyOffset);
  const keyLabel = currentKey ?? formatKeyOffset(keyOffset);
  const isOriginalKey = keyOffset === 0;
  const segmentedLines = details.cifraLines?.map((line) =>
    line.map((segment) =>
      segment.type === 'chord'
        ? {
            ...segment,
            text: transposeChordText(segment.text, keyOffset),
          }
        : segment,
    ),
  );

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  async function updateKey(nextOffset: number) {
    setKeyOffset(nextOffset);

    if (!repertoryId || !songId) {
      return;
    }

    const token = window.localStorage.getItem(tokenKey);

    if (!token) {
      setMessage('Entre na sua conta para salvar o tom no repertório.');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await updateSongKeyOffset(token, repertoryId, songId, nextOffset);
      setToastMessage('Tom salvo no repertório.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Erro ao salvar tom.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className='mt-6'>
      <div className='flex flex-wrap gap-2.5'>
        <ControlPill label='Letra'>
          <button
            aria-label='Diminuir tamanho da letra'
            className='control-pill-button text-xl'
            disabled={fontSize <= minFontSize}
            onClick={() =>
              setFontSize((current) => Math.max(minFontSize, current - 1))
            }
            type='button'
          >
            -
          </button>
          <button
            aria-label='Restaurar tamanho padrão'
            className='control-pill-label'
            onClick={() => setFontSize(defaultFontSize)}
            type='button'
          >
            Letra
          </button>
          <button
            aria-label='Aumentar tamanho da letra'
            className='control-pill-button text-xl'
            disabled={fontSize >= maxFontSize}
            onClick={() =>
              setFontSize((current) => Math.min(maxFontSize, current + 1))
            }
            type='button'
          >
            +
          </button>
        </ControlPill>

        <ControlPill label='Tom'>
          <button
            aria-label='Diminuir meio tom'
            className='control-pill-button text-base'
            disabled={isSaving}
            onClick={() => void updateKey(keyOffset - 1)}
            type='button'
          >
            -½
          </button>
          <div className='control-pill-label control-pill-label--key'>
            {isOriginalKey ? (
              'Tom'
            ) : (
              <>
                <span className='control-pill-current-key'>{keyLabel}</span>
                <button
                  aria-label='Voltar ao tom original'
                  className='control-pill-reset'
                  disabled={isSaving}
                  onClick={() => void updateKey(0)}
                  type='button'
                >
                  ×
                </button>
              </>
            )}
          </div>
          <button
            aria-label='Aumentar meio tom'
            className='control-pill-button text-base'
            disabled={isSaving}
            onClick={() => void updateKey(keyOffset + 1)}
            type='button'
          >
            +½
          </button>
        </ControlPill>
      </div>

      {message ? (
        <p className='mt-4 rounded-[12px] bg-[#FDF8F2] p-3 text-sm font-semibold text-[#6B3E21]/70'>
          {message}
        </p>
      ) : null}

      <div className='chord-sheet-frame mt-5'>
        <div className='chord-sheet' style={{ fontSize }}>
          {segmentedLines
            ? segmentedLines.map((line, index) => (
                <SegmentedChordLine key={index} line={line} />
              ))
            : lines.map((line, index) => (
                <PlainChordLine key={`${line}-${index}`} line={line} />
              ))}
        </div>
      </div>

      {toastMessage ? <AppToast message={toastMessage} /> : null}
    </div>
  );
}

function ControlPill({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div
      aria-label={label}
      className='grid min-w-[218px] grid-cols-[44px_minmax(82px,1fr)_44px] items-center rounded-full bg-[#F4EFEA] p-1'
    >
      {children}
    </div>
  );
}

function SegmentedChordLine({ line }: { line: ChordSegment[] }) {
  if (line.length === 0) {
    return <div className='chord-sheet__line'>&nbsp;</div>;
  }

  return (
    <div className='chord-sheet__line'>
      {line.map((segment, index) => {
        if (segment.type === 'chord') {
          return (
            <span
              className='chord-sheet__chord'
              key={`${segment.text}-${index}`}
              style={{
                color: '#B4432E',
                fontWeight: 700,
              }}
            >
              {segment.text}
            </span>
          );
        }

        return segment.text;
      })}
    </div>
  );
}

function PlainChordLine({ line }: { line: string }) {
  if (!line) {
    return <div className='chord-sheet__line'>&nbsp;</div>;
  }

  return (
    <div className='chord-sheet__line'>
      {line.split(/(\s+)/).map((part, index) => {
        if (!part.trim()) {
          return part;
        }

        if (isSectionToken(part)) {
          return (
            <span key={`${part}-${index}`} style={{ color: '#222222' }}>
              {part}
            </span>
          );
        }

        if (isChordToken(part)) {
          return (
            <span
              className='chord-sheet__chord'
              key={`${part}-${index}`}
              style={{
                color: '#B4432E',
                fontWeight: 700,
              }}
            >
              {part}
            </span>
          );
        }

        return part;
      })}
    </div>
  );
}
