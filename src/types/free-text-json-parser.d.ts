declare module 'free-text-json-parser' {
  interface ParseElement {
    type: 'text' | 'json';
    value: any;
  }

  interface ParseResult {
    elements: ParseElement[];
    text: string[];
    json: any[];
    summary: {
      totalElements: number;
      textSegments: number;
      jsonObjects: number;
    };
  }

  class FreeTextJsonParser {
    parse(input: string): ParseElement[];
    parseStructured(input: string): ParseResult;
    extractJson(input: string): any[];
    extractText(input: string): string[];
  }

  export { FreeTextJsonParser };
  export default FreeTextJsonParser;
}
