'use server';

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';


export async function summarizeNote(description: string) {
  const { text } = await generateText({
    model: google('gemini-1.5-pro-latest'),
    prompt: `Summarize this note ${description}.`,
  });

  return text;
}
