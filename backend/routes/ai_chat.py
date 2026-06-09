"""
OpenUI-Compatible AI Chat Route for Resonance
Uses Anthropic Claude as the backend model.
Streams in OpenAI-compatible NDJSON format so @openuidev/react-headless adapters work.
"""
import json
import logging
import os
from datetime import datetime

import anthropic
from fastapi import APIRouter, Request
from starlette.responses import StreamingResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai-chat"])

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Resonance-specific system prompt injected alongside the OpenUI component prompt
RESONANCE_CONTEXT = """
You are Resonance AI — an intelligent music assistant built into the Resonance music player.
You can help users with:
- Finding and recommending music tracks, artists, and albums
- Creating and managing playlists
- Explaining music history, genres, and theory
- Discovering trending music worldwide
- Answering questions about the user's library

When presenting music data, use structured cards, tables, and lists.
Keep responses concise and music-focused.
Today's date: {date}
""".strip()


@router.post("/chat")
async def ai_chat(request: Request):
    """
    Streams Anthropic Claude responses in OpenAI-compatible NDJSON format.
    Compatible with @openuidev/react-headless openAIReadableStreamAdapter.
    """
    if not ANTHROPIC_API_KEY:
        return {"error": "ANTHROPIC_API_KEY not set in backend .env"}

    body = await request.json()
    system_prompt: str = body.get("systemPrompt", "")
    messages: list = body.get("messages", [])

    # Merge OpenUI system prompt with Resonance context
    combined_system = (
        RESONANCE_CONTEXT.format(date=datetime.utcnow().strftime("%Y-%m-%d"))
        + "\n\n"
        + system_prompt
    ).strip()

    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

    async def stream_ndjson():
        """Stream Anthropic response as OpenAI-compatible NDJSON chunks."""
        chunk_id = "chatcmpl-resonance-" + datetime.utcnow().strftime("%H%M%S%f")
        try:
            async with client.messages.stream(
                model=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
                max_tokens=2048,
                system=combined_system,
                messages=messages,
            ) as stream:
                async for text_chunk in stream.text_stream:
                    # OpenAI-format delta chunk
                    chunk = {
                        "id": chunk_id,
                        "object": "chat.completion.chunk",
                        "created": int(datetime.utcnow().timestamp()),
                        "model": "claude-sonnet-4-20250514",
                        "choices": [{
                            "index": 0,
                            "delta": {"role": "assistant", "content": text_chunk},
                            "finish_reason": None,
                        }],
                    }
                    yield json.dumps(chunk) + "\n"

                # Final chunk with finish_reason
                final = {
                    "id": chunk_id,
                    "object": "chat.completion.chunk",
                    "created": int(datetime.utcnow().timestamp()),
                    "model": "claude-sonnet-4-20250514",
                    "choices": [{
                        "index": 0,
                        "delta": {},
                        "finish_reason": "stop",
                    }],
                }
                yield json.dumps(final) + "\n"

        except anthropic.APIError as e:
            logger.error(f"Anthropic API error: {e}")
            error_chunk = {"error": {"message": str(e), "type": "api_error"}}
            yield json.dumps(error_chunk) + "\n"
        except Exception as e:
            logger.error(f"ai_chat stream error: {e}")
            error_chunk = {"error": {"message": "Internal error", "type": "server_error"}}
            yield json.dumps(error_chunk) + "\n"

    return StreamingResponse(stream_ndjson(), media_type="application/x-ndjson")


@router.get("/health")
async def ai_health():
    return {
        "status": "ok",
        "anthropic_configured": bool(ANTHROPIC_API_KEY),
        "model": os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
    }
