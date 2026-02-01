'use client';

import { useEffect, useState, useRef } from 'react';
import { Terminal, Circle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export interface TerminalStep {
  text: string;
  type: 'command' | 'output' | 'success' | 'error' | 'info' | 'warning' | 'processing';
  delay?: number;
}

interface TerminalDemoProps {
  steps: TerminalStep[];
  className?: string;
}

export function TerminalDemo({ steps, className }: TerminalDemoProps) {
  const [lines, setLines] = useState<TerminalStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset when steps change
  useEffect(() => {
    setLines([]);
    setCurrentStepIndex(0);
    setDisplayText('');
    setIsTyping(false);
  }, [steps]);

  useEffect(() => {
    if (currentStepIndex >= steps.length) return;

    const step = steps[currentStepIndex];
    
    if (!isTyping) {
      setIsTyping(true);
      setDisplayText('');
      
      // If it's a command, type it out char by char with variable speed
      if (step.type === 'command') {
        let charIndex = 0;
        
        const typeNextChar = () => {
          if (charIndex < step.text.length) {
            setDisplayText(prev => prev + step.text[charIndex]);
            charIndex++;
            // Random typing delay between 30ms and 80ms
            const delay = Math.random() * 50 + 30;
            setTimeout(typeNextChar, delay);
          } else {
            setIsTyping(false);
            // Add full line and move to next
            setTimeout(() => {
              setLines(prev => [...prev, step]);
              setCurrentStepIndex(prev => prev + 1);
            }, 400);
          }
        };
        
        typeNextChar();
      } else if (step.type === 'processing') {
        // Show spinner for a while then move to next
        setLines(prev => [...prev, step]);
        setTimeout(() => {
          // Replace processing line with done or remove it? 
          // For now let's just move to next step which usually contains the result
          setCurrentStepIndex(prev => prev + 1);
          setIsTyping(false);
        }, step.delay || 1500);
      } else {
        // Instant output with delay
        const timeout = setTimeout(() => {
          setLines(prev => [...prev, step]);
          setCurrentStepIndex(prev => prev + 1);
          setIsTyping(false);
        }, step.delay || 300);
        return () => clearTimeout(timeout);
      }
    }
  }, [currentStepIndex, steps, isTyping]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, displayText, isTyping]);

  return (
    <div className={clsx("rounded-xl overflow-hidden bg-[#1e1e1e] border border-[#333] shadow-2xl font-mono text-sm", className)}>
      {/* Terminal Header */}
      <div className="flex items-center px-4 py-3 bg-[#252526] border-b border-[#333]">
        <div className="flex gap-2 mr-4">
          <Circle className="w-3 h-3 text-red-500 fill-red-500 hover:opacity-80 transition-opacity" />
          <Circle className="w-3 h-3 text-yellow-500 fill-yellow-500 hover:opacity-80 transition-opacity" />
          <Circle className="w-3 h-3 text-green-500 fill-green-500 hover:opacity-80 transition-opacity" />
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs select-none">
          <Terminal className="w-3 h-3" />
          <span>autopilot-cli — zsh</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div ref={scrollRef} className="p-4 h-[350px] overflow-y-auto space-y-1 font-mono leading-relaxed custom-scrollbar">
        {lines.map((line, i) => (
          <div key={i} className="break-all">
            <LineContent step={line} isLast={i === lines.length - 1} />
          </div>
        ))}
        
        {/* Active Typing Line */}
        {isTyping && steps[currentStepIndex]?.type === 'command' && (
          <div className="flex items-center">
            <span className="text-green-500 mr-2 shrink-0">➜</span>
            <span className="text-cyan-400 mr-2 shrink-0">~</span>
            <span className="text-gray-100">{displayText}</span>
            <span className="w-2.5 h-5 bg-gray-400 ml-1 animate-pulse" />
          </div>
        )}

        {/* Idle Prompt */}
        {!isTyping && currentStepIndex >= steps.length && (
          <div className="flex items-center mt-2">
            <span className="text-green-500 mr-2 shrink-0">➜</span>
            <span className="text-cyan-400 mr-2 shrink-0">~</span>
            <span className="w-2.5 h-5 bg-gray-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

function LineContent({ step, isLast }: { step: TerminalStep, isLast: boolean }) {
  if (step.type === 'processing') {
    // Only show spinner if it's the last line (active processing)
    // If it's not last, it means processing finished, so we can hide it or show "Done"
    if (!isLast) return null; 
    
    return (
      <div className="flex items-center text-blue-400 gap-2">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>{step.text}</span>
      </div>
    );
  }

  switch (step.type) {
    case 'command':
      return (
        <div className="flex mt-2 mb-1">
          <span className="text-green-500 mr-2 shrink-0">➜</span>
          <span className="text-cyan-400 mr-2 shrink-0">~</span>
          <span className="text-gray-100">{step.text}</span>
        </div>
      );
    case 'success':
      return <div className="text-emerald-400 flex gap-2"><span>✔</span>{step.text}</div>;
    case 'error':
      return <div className="text-red-400 flex gap-2"><span>✖</span>{step.text}</div>;
    case 'warning':
      return <div className="text-yellow-400 flex gap-2"><span>⚠</span>{step.text}</div>;
    case 'info':
      return <div className="text-blue-400 flex gap-2"><span>ℹ</span>{step.text}</div>;
    default:
      return <div className="text-gray-300">{step.text}</div>;
  }
}
