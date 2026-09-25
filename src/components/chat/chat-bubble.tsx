'use client';

import React from 'react';
import { Message } from '@/lib/types';
import { Check, CheckCheck } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  isMe: boolean;
  showSenderName?: boolean;
  showAvatar?: boolean;
}

export function ChatBubble({
  message,
  isMe,
  showSenderName = true,
  showAvatar = true,
}: ChatBubbleProps) {
  const sender = message.sender;

  // Format time (HH:mm)
  const formattedTime = new Date(message.created_at).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Role tag color palette
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'Ayah':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Ibu':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Kakak':
        return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      case 'Adik':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div
      className={`flex items-end gap-2.5 my-2.5 px-3 w-full transition-all duration-200 animate-fade-in ${
        isMe ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Receiver Avatar */}
      {!isMe && showAvatar && (
        <div className="relative flex-shrink-0 self-end mb-0.5">
          {sender?.avatar_url ? (
            <img
              src={sender.avatar_url}
              alt={sender.full_name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-white/30 dark:ring-white/10 shadow-sm"
              loading="lazy"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-300 to-zinc-200 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-200 ring-1 ring-white/30">
              {sender?.full_name?.charAt(0) || 'K'}
            </div>
          )}
          {sender?.is_online && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-zinc-900 shadow-sm" />
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[82%] sm:max-w-[70%] group transition-all duration-200 ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender Name & Role Tag (for receiver in groups) */}
        {!isMe && showSenderName && sender && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 tracking-tight">
              {sender.full_name}
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full border ${getRoleBadge(
                sender.role
              )}`}
            >
              {sender.role}
            </span>
          </div>
        )}

        {/* Message Bubble Box */}
        <div
          className={`relative px-4 py-2.5 text-sm md:text-[15px] leading-relaxed break-words transition-all duration-200 ${
            isMe
              ? 'bg-gradient-to-br from-[#007AFF] to-[#0A84FF] text-white rounded-2xl rounded-br-sm shadow-sm border border-white/20'
              : 'bg-white/80 dark:bg-zinc-800/85 backdrop-blur-xl border border-white/40 dark:border-white/10 text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-bl-sm shadow-sm'
          }`}
        >
          {/* Specular top highlight */}
          <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* Content */}
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* Timestamp and delivery receipts */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${
              isMe ? 'text-white/80' : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            <span>{formattedTime}</span>
            {isMe && (
              <span className="inline-flex items-center">
                {message.status === 'sending' ? (
                  <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white/80 border-t-transparent animate-spin inline-block ml-0.5" />
                ) : message.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 text-white/90" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
