import { useEffect, useState, useRef } from 'react';
import { Terminal, Circle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export interface TerminalStep {
  text: string;
  type: 'command' | 'output' | 'success' | 'error' | 'info' | 'warning' | 'processing' | 'debug' | 'section';
  delay?: number;
}

interface TerminalDemoProps {
  steps: TerminalStep[];
  className?: string;
}

function LineContent({ step, isLast }: { step: TerminalStep; isLast: boolean }) {
  const colors: Record<string, string> = {
    command: 'text-white font-semibold',
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-gray-300',
    processing: 'text-blue-400',
    debug: 'text-gray-500',
    section: 'text-link font-bold',
    output: 'text-gray-200',
  };

  return (
    <div className={clsx('flex items-start gap-2', colors[step.type] || 'text-gray-300')}>
      {step.type === 'command' && <span className="text-link select-none flex-shrink-0">$</span>}
      {step.type === 'processing' && isLast ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
          {step.text}
        </span>
      ) : (
        <span className="break-all">{step.text}</span>
      )}
    </div>
  );
}

export function TerminalDemo({ steps, className }: TerminalDemoProps) {
  const [lines, setLines] = useState<TerminalStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLines([]);
    setCurrentStepIndex(0);
    setDisplayText('');
    setIsTyping(false);
  }, [steps]);

  useEffect(() => {
    if (currentStepIndex >= steps.length) return;
    const step = steps[currentStepIndex];
    let timeoutId: ReturnType<typeof setTimeout>;
    setIsTyping(true);
    setDisplayText('');

    if (step.type === 'command') {
      let charIndex = 0;
      const typeNextChar = () => {
        if (charIndex < step.text.length) {
          setDisplayText(prev => prev + step.text[charIndex]);
          charIndex++;
          timeoutId = setTimeout(typeNextChar, Math.random() * 50 + 30);
        } else {
          setIsTyping(false);
          timeoutId = setTimeout(() => {
            setLines(prev => [...prev, step]);
            setCurrentStepIndex(prev => prev + 1);
          }, 400);
        }
      };
      typeNextChar();
    } else if (step.type === 'processing') {
      setLines(prev => [...prev, step]);
      timeoutId = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
        setIsTyping(false);
      }, step.delay || 1500);
    } else {
      timeoutId = setTimeout(() => {
        setLines(prev => [...prev, step]);
        setCurrentStepIndex(prev => prev + 1);
        setIsTyping(false);
      }, step.delay || 300);
    }

    return () => clearTimeout(timeoutId);
  }, [currentStepIndex, steps]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines, displayText, isTyping]);

  return (
    <div className={clsx('rounded-xl overflow-hidden bg-[#1e1e1e] border border-[#333] shadow-2xl font-mono text-sm', className)}>
      <div className="flex items-center px-4 py-3 bg-[#252526] border-b border-[#333]">
        <div className="flex gap-2 mr-4">
          <Circle className="w-3 h-3 text-red-500 fill-red-500" />
          <Circle className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <Circle className="w-3 h-3 text-green-500 fill-green-500" />
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs select-none">
          <Terminal className="w-3 h-3" />
          <span>autopilot-cli — zsh</span>
        </div>
      </div>
      <div ref={scrollRef} className="p-4 h-[350px] overflow-y-auto space-y-1 font-mono leading-relaxed custom-scrollbar">
        {lines.map((line, i) => (
          <div key={i} className="break-all">
            <LineContent step={line} isLast={i === lines.length - 1} />
          </div>
        ))}
        {isTyping && currentStepIndex < steps.length && steps[currentStepIndex].type === 'command' && (
          <div className="flex items-center gap-2 text-white">
            <span className="text-link select-none">$</span>
            <span>{displayText}</span>
            <span className="cursor-blink text-link">▌</span>
          </div>
        )}
        {currentStepIndex >= steps.length && (
          <div className="flex items-center gap-2 text-gray-500 mt-2">
            <span className="text-link select-none">$</span>
            <span className="cursor-blink text-link">▌</span>
          </div>
        )}
      </div>
    </div>
  );
}
