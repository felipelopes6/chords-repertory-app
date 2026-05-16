'use client';

import { useState } from 'react';

import { updateSongKeyOffset } from '../api';
import type { SongDetails } from '../types';
import {
  formatKeyOffset,
  transposeCifra,
  transposeKey,
} from '../lib/transpose';

type ChordViewerProps = {
  details: SongDetails;
  initialOffset?: number;
  repertoryId?: string;
  songId?: string;
};

const tokenKey = 'music-repertory-token';

export function ChordViewer({
  details,
  initialOffset = 0,
  repertoryId,
  songId,
}: ChordViewerProps) {
  const [keyOffset, setKeyOffset] = useState(initialOffset);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const currentKey = transposeKey(details.originalKey, keyOffset);
  const lines = transposeCifra(details.cifra, keyOffset);

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
      setMessage('Tom salvo no repertório.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Erro ao salvar tom.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className='mt-8'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm font-bold text-[#6B3E21]/60'>Tom</p>
          <p className='mt-1 text-base font-bold text-[#6B3E21]'>
            {currentKey ?? formatKeyOffset(keyOffset)}
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          <button
            className='rounded-[10px] border border-[#6B3E21]/15 px-3 py-2 text-sm font-bold text-[#6B3E21]/85'
            disabled={isSaving}
            onClick={() => void updateKey(keyOffset - 1)}
            type='button'
          >
            - 1/2 tom
          </button>
          <button
            className='rounded-[10px] border border-[#6B3E21]/15 px-3 py-2 text-sm font-bold text-[#6B3E21]/85'
            disabled={isSaving}
            onClick={() => void updateKey(0)}
            type='button'
          >
            Original
          </button>
          <button
            className='rounded-[10px] border border-[#6B3E21]/15 px-3 py-2 text-sm font-bold text-[#6B3E21]/85'
            disabled={isSaving}
            onClick={() => void updateKey(keyOffset + 1)}
            type='button'
          >
            + 1/2 tom
          </button>
        </div>
      </div>

      {message ? (
        <p className='mt-4 rounded-[12px] bg-[#FDF8F2] p-3 text-sm font-semibold text-[#6B3E21]/70'>
          {message}
        </p>
      ) : null}

      <div className='mt-5 rounded-[12px] bg-[#FDF8F2] p-4 sm:p-5'>
        <pre className='overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-7 text-[#6B3E21]'>
          {lines.join('\n')}
        </pre>
      </div>
    </div>
  );
}
