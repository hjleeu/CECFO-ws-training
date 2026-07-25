"use client"

import '@/styles/sheet.css'
import { ShowOptions } from '@/types/MusicNotation';
import { useState } from 'react';

export default function TrainingPage() {
  const [showOptions, setOptions] = useState<ShowOptions>({
      chords: true,
      jianpu: true,
      lyrics: true,
      pinyin: true
    });
  
    const toggle = (key: keyof ShowOptions) => {
      setOptions(prev => ({...prev, [key]: !prev[key]}));
    };
    
    return (
      <div>
        TO DO
      </div>
    );
}