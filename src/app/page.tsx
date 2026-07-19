"use client"

import { Section } from '@/components/sheet/Section'
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
        <div>
          {(Object.keys(showOptions) as (keyof ShowOptions)[]).map(key => (
            <button key={key} onClick={() => toggle(key)}>
              {key}: {showOptions[key] ? "on" : "off"}
            </button>
          ))}
        </div>
  
        <Section
          section={{
            label: "Verse 1",
            rows: [
              {
                measures: [
                  {
                    notes: [
                      { note: "5'", char: "你", pinyin: "ni"}
                    ]
                  }
                ]
              }
            ]
          }}
          showOptions={showOptions}
        ></Section>
      </div>
    );
}