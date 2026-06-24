import { createHash } from "node:crypto";
import { mkdir, writeFile, access } from "node:fs/promises";
import { join, resolve, isAbsolute } from "node:path";
import OpenAI from "openai";
import { env, requireEnv } from "../lib/env.js";
import { logger } from "../lib/logger.js";

let client: OpenAI | null = null;
function openai() {
  if (!client) client = new OpenAI({ apiKey: requireEnv.openAiKey() });
  return client;
}

/** Absolute path of the audio cache directory (created on demand). */
export function audioCacheDir() {
  return isAbsolute(env.AUDIO_CACHE_DIR)
    ? env.AUDIO_CACHE_DIR
    : resolve(process.cwd(), env.AUDIO_CACHE_DIR);
}

function hashTranscript(transcript: string) {
  return createHash("sha256")
    .update(`${env.OPENAI_TTS_MODEL}:${env.OPENAI_TTS_VOICE}:${transcript}`)
    .digest("hex")
    .slice(0, 32);
}

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Synthesize Listening audio for a transcript via OpenAI TTS.
 * Cached on disk by a hash of (model, voice, transcript) so identical
 * transcripts are only generated once. Returns a relative URL ("/audio/<h>.mp3")
 * that the frontend prefixes with NEXT_PUBLIC_API_URL.
 */
export async function synthesizeListeningAudio(transcript: string): Promise<string> {
  const dir = audioCacheDir();
  await mkdir(dir, { recursive: true });

  const hash = hashTranscript(transcript);
  const fileName = `${hash}.mp3`;
  const filePath = join(dir, fileName);
  const url = `/audio/${fileName}`;

  if (await fileExists(filePath)) {
    logger.debug("TTS cache hit", { hash });
    return url;
  }

  logger.info("Synthesizing TTS audio", { hash, chars: transcript.length });
  const response = await openai().audio.speech.create({
    model: env.OPENAI_TTS_MODEL,
    voice: env.OPENAI_TTS_VOICE as never, // provider voice id
    input: transcript,
    response_format: "mp3",
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
  return url;
}
