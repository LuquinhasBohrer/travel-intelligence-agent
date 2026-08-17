import { contextBridge, ipcRenderer } from 'electron';
import { AppSnapshot, ParsedIntent, TripInput } from '../shared/types';

contextBridge.exposeInMainWorld('travelAgent', {
  getSnapshot: (): Promise<AppSnapshot> => ipcRenderer.invoke('app:snapshot'),
  parseIntent: (text: string): Promise<ParsedIntent> => ipcRenderer.invoke('agent:parse', text),
  createTrip: (input: TripInput): Promise<string> => ipcRenderer.invoke('trip:create', input),
  searchTrip: (id: string): Promise<void> => ipcRenderer.invoke('trip:search', id),
  deleteTrip: (id: string): Promise<void> => ipcRenderer.invoke('trip:delete', id)
});
