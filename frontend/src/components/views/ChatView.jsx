import React, { memo } from "react";
import { openAIMessageFormat, openAIReadableStreamAdapter } from "@openuidev/react-headless";
import { BottomTray } from "@openuidev/react-ui";
import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui/genui-lib";
import "@openuidev/react-ui/components.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const systemPrompt = openuiLibrary.prompt(openuiPromptOptions);

const STARTERS = [
  { label: "🎵 Recommend music", prompt: "Recommend 5 tracks based on a late-night driving mood" },
  { label: "🔥 Trending now",    prompt: "What music is trending in South Africa right now?" },
  { label: "🎤 Artist info",     prompt: "Tell me about The Weeknd — bio, top tracks, similar artists" },
  { label: "🎸 Genre explore",   prompt: "Explain Amapiano music — history, key artists, recommended tracks" },
  { label: "📀 Playlist idea",   prompt: "Build me a workout playlist with high-energy hip-hop and electronic tracks" },
  { label: "🎼 Music theory",    prompt: "What's the difference between jazz and blues?" },
];

/**
 * ChatView — AI music assistant powered by OpenUI + Anthropic Claude.
 *
 * Uses @openuidev/react-ui BottomTray surface so it sits naturally
 * in Resonance's sidebar layout.
 *
 * Features:
 *  - Streaming responses from Claude via /api/ai/chat
 *  - OpenUI structured component rendering (cards, tables, charts)
 *  - 6 music-focused conversation starters
 *  - Midnight Samurai theme via CSS overrides
 */
const ChatView = memo(() => {
  const processMessage = async ({ messages, abortController }) => {
    return fetch(`${BACKEND_URL}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt,
        messages: openAIMessageFormat.toApi(messages),
      }),
      signal: abortController.signal,
    });
  };

  return (
    <div className="flex flex-col h-full w-full" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "rgba(200,200,204,0.1)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#C49A28,#8B6B1A)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#030306" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#EBEBED" }}>Resonance AI</p>
          <p className="text-xs" style={{ color: "#3D3D45" }}>Powered by Claude</p>
        </div>
      </div>

      {/* OpenUI Chat Surface */}
      <div className="flex-1 overflow-hidden openui-resonance">
        <BottomTray
          processMessage={processMessage}
          streamProtocol={openAIReadableStreamAdapter()}
          componentLibrary={openuiLibrary}
          agentName="Resonance AI"
          welcomeMessage={{
            title: "Your music assistant",
            description: "Ask me anything about music — recommendations, artists, lyrics, history, or your library.",
          }}
          conversationStarters={STARTERS}
        />
      </div>
    </div>
  );
});

ChatView.displayName = "ChatView";
export default ChatView;
