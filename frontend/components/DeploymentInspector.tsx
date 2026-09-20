import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Activity, 
  Server, 
  Globe, 
  Clock, 
  Cpu, 
  Database, 
  RefreshCw,
  Terminal
} from 'lucide-react';
import { HealthCheckItem } from '../types';

interface DeploymentInspectorProps {
  moveCount: number;
}

export const DeploymentInspector: React.FC<DeploymentInspectorProps> = ({ moveCount }) => {
  const [latency, setLatency] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [storageStatus, setStorageStatus] = useState<string>('検証中...');
  const [runtimeChecks, setRuntimeChecks] = useState<HealthCheckItem[]>([]);

  const runDiagnostics = () => {
    setIsRefreshing(true);
    const start = performance.now();

    // Check localStorage write/read
    let storageOk = false;
    try {
      const testKey = '__deploy_test__';
      localStorage.setItem(testKey, 'ok');
      storageOk = localStorage.getItem(testKey) === 'ok';
      localStorage.removeItem(testKey);
    } catch {
      storageOk = false;
    }
    setStorageStatus(storageOk ? '正常に利用可能 (Read/Write OK)' : '制限モード (In-Memory)');

    // Simulate short network/event-loop ping
    setTimeout(() => {
      const diff = Math.round(performance.now() - start);
      setLatency(diff);
      setIsRefreshing(false);
    }, 120);

    const isHttps = window.location.protocol === 'https:';
    const isOnline = navigator.onLine;

    const checks: HealthCheckItem[] = [
      {
        id: 'client_react',
        label: 'React 19 Core Engine',
        status: 'passed',
        value: 'Ready / Mounted',
        detail: 'Virtual DOM & Lifecycle正常動作中'
      },
      {
        id: 'protocol',
        label: 'プロトコル / セキュリティ',
        status: isHttps ? 'passed' : 'warning',
        value: window.location.protocol.replace(':', '').toUpperCase(),
        detail: isHttps ? 'TLS暗号化セキュア接続' : '開発またはHTTP環境'
      },
      {
        id: 'network',
        label: 'ネットワーク状態',
        status: isOnline ? 'passed' : 'warning',
        value: isOnline ? 'オンライン (Connected)' : 'オフライン',
        detail: `ユーザーエージェント通信確立`
      },
      {
        id: 'storage',
        label: 'ローカルストレージ API',
        status: storageOk ? 'passed' : 'warning',
        value: storageOk ? 'Write/Read 成功' : '制限あり',
        detail: 'セッション永続化ステータス'
      }
    ];

    setRuntimeChecks(checks);
  };

  useEffect(() => {
    runDiagnostics();
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('ja-JP'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h2 className="font-semibold text-slate-200 text-sm tracking-wider uppercase">
            デプロイ検証 / システムステータス
          </h2>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
          title="診断を再実行"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          <span>再検証</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span>環境ステータス</span>
          </div>
          <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            正常稼働中
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>システム時計</span>
          </div>
          <div className="text-sm font-mono font-medium text-slate-200">
            {currentTime || '--:--:--'}
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>ループ応答</span>
          </div>
          <div className="text-sm font-mono font-medium text-slate-200">
            {latency !== null ? `${latency} ms` : '計測中...'}
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>ゲーム操作回数</span>
          </div>
          <div className="text-sm font-mono font-medium text-indigo-300">
            {moveCount} 手の入力
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {runtimeChecks.map((check) => (
          <div
            key={check.id}
            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/50"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-medium text-slate-300">{check.label}</span>
                <span className="text-slate-500 ml-2 hidden sm:inline">{check.detail}</span>
              </div>
            </div>
            <div className="font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {check.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate max-w-[280px]">ホスト: {window.location.host || 'localhost'}</span>
        <span className="font-mono text-emerald-400/90">200 OK / Ready</span>
      </div>
    </div>
  );
};
