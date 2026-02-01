'use client';

import { useEffect, useState, useRef } from 'react';
import { Terminal, Circle } from 'lucide-react';
import clsx from 'clsx';

export interface TerminalStep {
  text: string;
  type: 'command' | 'output' | 'success' | 'error' | 'info' | 'warning';
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
      
      // If it's a command, type it out char by char
      if (step.type === 'command') {
        let charIndex = 0;
        const typeInterval = setInterval(() => {
          if (charIndex < step.text.length) {
            setDisplayText(prev => prev + step.text[charIndex]);
            charIndex++;
          } else {
            clearInterval(typeInterval);
            setIsTyping(false);
            // Add full line and move to next
            setTimeout(() => {
              setLines(prev => [...prev, step]);
              setCurrentStepIndex(prev => prev + 1);
            }, 300);
          }
        }, 50); // Typing speed
        return () => clearInterval(typeInterval);
      } else {
        // Instant output with delay
        const timeout = setTimeout(() => {
          setLines(prev => [...prev, step]);
          setCurrentStepIndex(prev => prev + 1);
          setIsTyping(false);
        }, step.delay || 400);
        return () => clearTimeout(timeout);
      }
    }
  }, [currentStepIndex, steps, isTyping]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, displayText]);

  return (
    <div className={clsx("rounded-xl overflow-hidden bg-[#1e1e1e] border border-[#333] shadow-2xl font-mono text-sm", className)}>
      {/* Terminal Header */}
      <div className="flex items-center px-4 py-3 bg-[#252526] border-b border-[#333]">
        <div className="flex gap-2 mr-4">
          <Circle className="w-3 h-3 text-red-500 fill-red-500" />
          <Circle className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <Circle className="w-3 h-3 text-green-500 fill-green-500" />
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Terminal className="w-3 h-3" />
          <span>autopilot-cli — zsh</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div ref={scrollRef} className="p-4 h-[300px] overflow-y-auto space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="break-all">
            <LineContent step={line} />
          </div>
        ))}
        {isTyping && steps[currentStepIndex]?.type === 'command' && (
          <div className="flex items-center">
            <span className="text-green-500 mr-2">$</span>
            <span className="text-gray-100">{displayText}</span>
            <span className="w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
          </div>
        )}
        {!isTyping && currentStepIndex >= steps.length && (
          <div className="flex items-center">
            <span className="text-green-500 mr-2">$</span>
            <span className="w-2 h-4 bg-gray-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

function LineContent({ step }: { step: TerminalStep }) {
  switch (step.type) {
    case 'command':
      return (
        <div className="flex">
          <span className="text-green-500 mr-2 shrink-0">$</span>
          <span className="text-gray-100">{step.text}</span>
        </div>
      );
    case 'success':
      return <div className="text-green-400">{step.text}</div>;
    case 'error':
      return <div className="text-red-400">{step.text}</div>;
    case 'warning':
      return <div className="text-yellow-400">{step.text}</div>;
    case 'info':
      return <div className="text-blue-400">{step.text}</div>;
    default:
      return <div className="text-gray-300">{step.text}</div>;
  }
}
