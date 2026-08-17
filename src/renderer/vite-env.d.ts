/// <reference types="vite/client" />
import { AppSnapshot, ParsedIntent, TripInput } from '../shared/types';

declare global {
  interface Window {
    travelAgent: {
      getSnapshot(): Promise<AppSnapshot>;
      parseIntent(text: string): Promise<ParsedIntent>;
      createTrip(input: TripInput): Promise<string>;
      searchTrip(id: string): Promise<void>;
      deleteTrip(id: string): Promise<void>;
    };
  }
}
export {};
