'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Heart, ThumbsUp, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<boolean>;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, onTyping, disabled = false }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || isSending || disabled) return;

    const messageText = content.trim();
    setContent('');
    if (onTyping) onTyping(false);
    setIsSending(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      await onSendMessage(messageText);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSendQuick = (emoji: string) => {
    onSendMessage(emoji);
    setShowQuickReactions(false);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4 pt-1">
      {/* Quick Reactions Popover (iOS Clean Glass) */}
      {showQuickReactions && (
        <div className="absolute -top-12 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-glass animate-slide-up z-20">
          {['❤️', '👍', '😊', '🙏', '🎉', '🍱'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSendQuick(emoji)}
              className="text-lg hover:scale-125 active:scale-95 transition-transform duration-150 p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Floating Translucent Dock */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-1.5 sm:p-2 rounded-[28px] bg-white/70 dark:bg-zinc-900/75 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-ios-float transition-all duration-300 focus-within:ring-2 focus-within:ring-[#007AFF]/30"
      >
        {/* Attachment / Emoji Button */}
        <div className="flex items-center gap-1 pl-1.5 pb-1">
          <button
            type="button"
            onClick={() => setShowQuickReactions(!showQuickReactions)}
            className="p-2 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors active:scale-90"
            title="Kirim Reaksi Cepat"
          >
            <Smile className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>

        {/* Text Input Area */}
        <div className="flex-1 min-w-0 py-1">
          <textarea
            ref={inputRef}
            rows={1}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan untuk keluarga..."
            disabled={disabled}
            className="w-full bg-transparent resize-none outline-none text-sm sm:text-[15px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 leading-normal max-h-32 px-1"
          />
        </div>

        {/* Send Button */}
        <div className="flex items-center pb-0.5 pr-1">
          <button
            type="submit"
            disabled={!content.trim() || isSending || disabled}
            className={`p-2.5 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm ${
              content.trim()
                ? 'bg-[#007AFF] text-white hover:bg-[#0A84FF] active:scale-90 shadow-blue-500/25 shadow-md'
                : 'bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
            }`}
            title="Kirim Pesan"
          >
            {isSending ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
