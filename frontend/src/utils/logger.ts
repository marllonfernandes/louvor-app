export type LogLevel = 'info' | 'warn' | 'error';
export type LogCategory = 'AUTH' | 'FIRESTORE' | 'SISTEMA' | 'PWA' | 'REDE';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  detail?: string;
}

const STORAGE_KEY = 'app_diagnostic_logs';
const MAX_LOGS = 60;

class AppLogger {
  private logs: LogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private initialized = false;

  constructor() {
    this.loadLogs();
    this.setupGlobalHandlers();
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      this.logs = [];
    }
  }

  private persistLogs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(-MAX_LOGS)));
    } catch {
      // localStorage indisponível ou quota excedida
    }
  }

  private setupGlobalHandlers() {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;

    // Captura erros globais não tratados no browser
    window.addEventListener('error', (event) => {
      this.error(
        'SISTEMA',
        event.message || 'Erro não tratado no navegador',
        event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`
      );
    });

    // Captura rejeições de Promises não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = typeof reason === 'string' ? reason : reason?.message || 'Promise rejeitada sem tratamento';
      const detail = reason?.stack || (typeof reason === 'object' ? JSON.stringify(reason) : undefined);
      this.error('SISTEMA', message, detail);
    });
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Ignora erros de listener
      }
    });
  }

  private addEntry(level: LogLevel, category: LogCategory, message: string, rawDetail?: unknown) {
    let detailStr: string | undefined;

    if (rawDetail !== undefined) {
      if (typeof rawDetail === 'string') {
        detailStr = rawDetail;
      } else if (rawDetail instanceof Error) {
        detailStr = rawDetail.stack || rawDetail.message;
      } else {
        try {
          detailStr = JSON.stringify(rawDetail, null, 2);
        } catch {
          detailStr = String(rawDetail);
        }
      }
    }

    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      detail: detailStr,
    };

    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }
    this.persistLogs();
    this.notify();

    // No ambiente de desenvolvimento (DEV), exibe no console para inspeção direta
    if (import.meta.env.DEV) {
      const prefix = `[${category}]`;
      if (level === 'error') {
        console.error(prefix, message, rawDetail ?? '');
      } else if (level === 'warn') {
        console.warn(prefix, message, rawDetail ?? '');
      } else {
        console.log(prefix, message, rawDetail ?? '');
      }
    }
    // Em produção (PROD):
    // Não exibe console.log/info para preservar privacidade e não expor infraestrutura.
    // Para erros graves em produção, mantemos um aviso resumido no console se necessário, mas os detalhes ficam salvos no buffer de diagnóstico seguro.
  }

  public info(category: LogCategory, message: string, detail?: unknown) {
    this.addEntry('info', category, message, detail);
  }

  public warn(category: LogCategory, message: string, detail?: unknown) {
    this.addEntry('warn', category, message, detail);
  }

  public error(category: LogCategory, message: string, detail?: unknown) {
    this.addEntry('error', category, message, detail);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignora erro
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public exportLogsAsText(): string {
    const header = [
      `=== DIAGNÓSTICO DO SISTEMA (LOUVOR APP) ===`,
      `Data/Hora: ${new Date().toLocaleString('pt-BR')}`,
      `Plataforma: ${navigator.userAgent}`,
      `Online: ${navigator.onLine ? 'SIM' : 'NÃO'}`,
      `Ambiente: ${import.meta.env.MODE || 'desconhecido'}`,
      `Total de Registros: ${this.logs.length}`,
      `===========================================\n`,
    ].join('\n');

    const body = this.logs
      .map((entry) => {
        const time = new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour12: false });
        let text = `[${time}] [${entry.level.toUpperCase()}] [${entry.category}]: ${entry.message}`;
        if (entry.detail) {
          text += `\n   Detalhes: ${entry.detail}`;
        }
        return text;
      })
      .join('\n');

    return `${header}${body}`;
  }
}

export const appLogger = new AppLogger();
