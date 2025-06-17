declare module 'pptxgenjs' {
  interface Slide {
    addText(text: string, options?: any): void;
    addImage(options: { data: string; x: number; y: number; w: number; h: number }): void;
  }
  interface SlideMaster {
    title: string;
    background?: { color: string };
    objects?: Array<{ text: { text: string; options: any } }>;
  }
  class PptxGenJS {
    defineSlideMaster(options: SlideMaster): void;
    addSlide(masterName?: string): Slide;
    save(filename: string): Promise<void>;
  }
  export default PptxGenJS;
}