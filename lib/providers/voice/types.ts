export interface VoiceProvider {
  generateSpeech(text: string): Promise<Buffer>;
}
