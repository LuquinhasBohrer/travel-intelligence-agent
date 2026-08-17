import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { TravelDatabase } from './database/database';
import { ProviderRegistry } from './providers/registry';
import { AgentOrchestrator } from './services/orchestrator';
import { parseIntent } from './services/intentParser';
import { TripInput } from '../shared/types';

let database: TravelDatabase;
let orchestrator: AgentOrchestrator;
let providers: ProviderRegistry;

function createWindow() {
  const window = new BrowserWindow({ width: 1440, height: 940, minWidth: 1080, minHeight: 720, backgroundColor: '#09111f', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  const devUrl = process.env.ELECTRON_DEV_URL;
  if (devUrl) window.loadURL(devUrl);
  else window.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
  window.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
}

app.whenReady().then(async () => {
  database = await TravelDatabase.open(app.getPath('userData'));
  providers = new ProviderRegistry();
  orchestrator = new AgentOrchestrator(database, providers);
  ipcMain.handle('app:snapshot', () => database.snapshot(providers.listStatus()));
  ipcMain.handle('agent:parse', (_event, text: string) => parseIntent(text));
  ipcMain.handle('trip:create', (_event, input: TripInput) => database.createTrip(input));
  ipcMain.handle('trip:search', async (_event, id: string) => orchestrator.searchTrip(id));
  ipcMain.handle('trip:delete', (_event, id: string) => database.deleteTrip(id));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
