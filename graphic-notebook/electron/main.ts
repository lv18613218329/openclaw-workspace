import { app, BrowserWindow, ipcMain, screen } from "electron";
import { join } from "path";

process.on("uncaughtException", (e) => console.error("Error:", e));

process.env.DIST_ELECTRON = join(__dirname, "..");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");

let mainWindow: BrowserWindow | null = null;
let annotationWindow: BrowserWindow | null = null;
const VITE = process.env.VITE_DEV_SERVER_URL;

function createMain() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    webPreferences: { preload: join(__dirname, "preload.js"), nodeIntegration: false, contextIsolation: true },
    backgroundColor: '#00000000',
  });

  if (VITE) mainWindow.loadURL(VITE);
  else mainWindow.loadFile(join(process.env.DIST!, "index.html"));
}

function openAnnotation() {
  if (annotationWindow) { annotationWindow.focus(); return; }
  
  const ws = screen.getPrimaryDisplay().workAreaSize;
  
  annotationWindow = new BrowserWindow({
    width: ws.width, height: ws.height,
    x: 0, y: 0,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    webPreferences: { preload: join(__dirname, "preload.js"), nodeIntegration: false, contextIsolation: true },
  });

  const url = VITE ? VITE + '#/annotation' : join(process.env.DIST!, "index.html");
  if (VITE) annotationWindow.loadURL(url);
  else annotationWindow.loadFile(url, { hash: '/annotation' });

  mainWindow?.hide();
  annotationWindow.on("closed", () => {
    annotationWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  console.log("Annotation window opened at fullscreen");
}

function closeAnnotation() {
  if (annotationWindow && !annotationWindow.isDestroyed()) {
    annotationWindow.close();
    return;
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }
}

function setAnnotationClickThrough(ignore: boolean) {
  if (!annotationWindow || annotationWindow.isDestroyed()) return;
  annotationWindow.setIgnoreMouseEvents(ignore, { forward: true });
}

function setMainClickThrough(ignore: boolean) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
}

app.whenReady().then(createMain);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

ipcMain.handle("app:version", () => app.getVersion());
ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:close", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});
ipcMain.handle("window:openAnnotation", openAnnotation);
ipcMain.handle("window:closeAnnotation", closeAnnotation);
ipcMain.handle("annotation:setClickThrough", (_event, ignore: boolean) => {
  setAnnotationClickThrough(Boolean(ignore));
});
ipcMain.handle("window:setMainClickThrough", (_event, ignore: boolean) => {
  setMainClickThrough(Boolean(ignore));
});
