"use client"

import { Sheet } from '@/components/sheet/Sheet'
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
  
        <Sheet
          sheet={{
            label: "Verse 1",
            rows: [
              {
                measures: [
                  {
                    chords: ["G"],
                    notes: [
                      { note: "5'", char: "你", pinyin: "ni"}
                    ]
                  }
                ]
              }
            ]
          }}
          showOptions={showOptions}
        ></Sheet>
      </div>
    );
}