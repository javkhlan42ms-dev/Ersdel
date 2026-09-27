import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X, Hash } from 'lucide-react';

export const MONGOLIAN_CYRILLIC_ALPHABET = [
  'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И',
  'Й', 'К', 'Л', 'М', 'Н', 'О', 'Ө', 'П', 'Р', 'С',
  'Т', 'У', 'Ү', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ',
  'Ы', 'Ь', 'Э', 'Ю', 'Я'
];

interface RegistrationNumberInputProps {
  id?: string;
  value?: string;
  disabled?: boolean;
  onChange: (val: string) => void;
}

export const RegistrationNumberInput: React.FC<RegistrationNumberInputProps> = ({
  id = 'reg-number',
  value = '',
  disabled = false,
  onChange
}) => {
  // Parse incoming value into letter1, letter2, and 8 digits
  const parseVal = (raw: string) => {
    if (!raw) return { l1: '', l2: '', d: '' };
    const upper = raw.trim().toUpperCase();
    const c1 = upper.charAt(0);
    const c2 = upper.charAt(1);

    const hasL1 = MONGOLIAN_CYRILLIC_ALPHABET.includes(c1);
    const hasL2 = hasL1 && MONGOLIAN_CYRILLIC_ALPHABET.includes(c2);

    const l1 = hasL1 ? c1 : '';
    const l2 = hasL2 ? c2 : '';

    let remainder = '';
    if (hasL1 && hasL2) {
      remainder = upper.slice(2);
    } else if (hasL1) {
      remainder = upper.slice(1);
    } else {
      remainder = upper;
    }

    const d = remainder.replace(/\D/g, '').slice(0, 8);
    return { l1, l2, d };
  };

  const parsed = parseVal(value);
  const [letter1, setLetter1] = useState(parsed.l1);
  const [letter2, setLetter2] = useState(parsed.l2);
  const [digits, setDigits] = useState(parsed.d);

  // Synchronize when external value changes
  useEffect(() => {
    const current = parseVal(value);
    setLetter1(current.l1);
    setLetter2(current.l2);
    setDigits(current.d);
  }, [value]);

  const updateCombined = (newL1: string, newL2: string, newD: string) => {
    setLetter1(newL1);
    setLetter2(newL2);
    setDigits(newD);
    const combined = `${newL1}${newL2}${newD}`;
    onChange(combined);
  };

  const handleLetter1Change = (newLetter: string) => {
    updateCombined(newLetter, letter2, digits);
  };

  const handleLetter2Change = (newLetter: string) => {
    updateCombined(letter1, newLetter, digits);
  };

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 8);
    updateCombined(letter1, letter2, numericOnly);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation & standard control keys
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
    ) {
      return;
    }

    // Disallow any non-numeric character
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleClear = () => {
    if (disabled) return;
    updateCombined('', '', '');
  };

  const isComplete = Boolean(letter1 && letter2 && digits.length === 8);
  const hasPartialInput = Boolean(letter1 || letter2 || digits.length > 0);

  return (
    <div className="space-y-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5 max-w-2xl">
      {/* 3 Column Inputs: Letter 1, Letter 2, 8 Digits */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        {/* Column 1: 1st Letter */}
        <div className="sm:col-span-3">
          <label
            htmlFor={`${id}-l1`}
            className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
          >
            1-р үсэг <span className="text-blue-600 font-normal font-sans">(Үсэг 1)</span>
          </label>
          <div className="relative">
            <select
              id={`${id}-l1`}
              value={letter1}
              disabled={disabled}
              onChange={(e) => handleLetter1Change(e.target.value)}
              className={`w-full px-3 py-2.5 bg-white border rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${
                disabled
                  ? 'bg-slate-100 cursor-not-allowed text-slate-400 border-slate-200'
                  : letter1
                  ? 'border-blue-500 bg-blue-50/40 text-blue-900'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <option value="">Сонгох</option>
              {MONGOLIAN_CYRILLIC_ALPHABET.map((char) => (
                <option key={`l1-${char}`} value={char}>
                  {char}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Column 2: 2nd Letter */}
        <div className="sm:col-span-3">
          <label
            htmlFor={`${id}-l2`}
            className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
          >
            2-р үсэг <span className="text-blue-600 font-normal font-sans">(Үсэг 2)</span>
          </label>
          <div className="relative">
            <select
              id={`${id}-l2`}
              value={letter2}
              disabled={disabled}
              onChange={(e) => handleLetter2Change(e.target.value)}
              className={`w-full px-3 py-2.5 bg-white border rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${
                disabled
                  ? 'bg-slate-100 cursor-not-allowed text-slate-400 border-slate-200'
                  : letter2
                  ? 'border-blue-500 bg-blue-50/40 text-blue-900'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <option value="">Сонгох</option>
              {MONGOLIAN_CYRILLIC_ALPHABET.map((char) => (
                <option key={`l2-${char}`} value={char}>
                  {char}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Column 3: Next 8 Digits */}
        <div className="sm:col-span-6">
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor={`${id}-digits`}
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              Дараагийн 8 орон <span className="text-emerald-700 font-normal font-sans">(Зөвхөн тоо)</span>
            </label>
            <span className="text-[11px] font-mono font-medium text-slate-500">
              {digits.length}/8 орон
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              id={`${id}-digits`}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={digits}
              disabled={disabled}
              placeholder="Жишээ: 10251412"
              onKeyDown={handleKeyDown}
              onChange={handleDigitsChange}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-mono tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                disabled
                  ? 'bg-slate-100 cursor-not-allowed text-slate-400 border-slate-200'
                  : digits.length === 8
                  ? 'border-emerald-500 bg-emerald-50/30'
                  : digits.length > 0
                  ? 'border-amber-400'
                  : 'border-slate-300 focus:border-blue-500'
              }`}
            />
            <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
              <Hash className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Feedback Bar */}
      <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-600 font-medium">Регистрийн дугаар:</span>

          {/* Formatted display */}
          <div className="inline-flex items-center gap-1 font-mono">
            <span
              className={`px-2 py-0.5 rounded border text-xs font-bold ${
                letter1
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-slate-100 text-slate-400 border-dashed border-slate-300'
              }`}
            >
              {letter1 || '_'}
            </span>
            <span
              className={`px-2 py-0.5 rounded border text-xs font-bold ${
                letter2
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-slate-100 text-slate-400 border-dashed border-slate-300'
              }`}
            >
              {letter2 || '_'}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded border text-xs font-bold tracking-widest ${
                digits.length === 8
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : digits.length > 0
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-400 border-dashed border-slate-300'
              }`}
            >
              {digits ? digits.padEnd(8, '_') : '________'}
            </span>
          </div>

          {/* Status Message */}
          {isComplete ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs ml-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Зөв оруулсан ({letter1}{letter2}{digits})</span>
            </span>
          ) : hasPartialInput ? (
            <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-xs ml-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {!letter1
                  ? '1-р үсгийг сонгоно уу'
                  : !letter2
                  ? '2-р үсгийг сонгоно уу'
                  : `8 оронтой тоог бүрэн оруулна уу (${digits.length}/8)`}
              </span>
            </span>
          ) : (
            <span className="text-slate-400 text-xs">
              (Эхний 2 үсгийг сонгож, дараагийн 8 орон тоог бичнэ үү)
            </span>
          )}
        </div>

        {/* Clear Button */}
        {hasPartialInput && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors self-end sm:self-auto cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Арилгах</span>
          </button>
        )}
      </div>
    </div>
  );
};
