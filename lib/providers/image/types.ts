export interface ImageProvider {
  generateImage(prompt: string, width: number, height: number): Promise<Buffer>;
}
