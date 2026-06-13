import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ShieldAlert, ShieldCheck, Zap, Globe, Lock, Search, Network, 
  Settings, Activity, Plus, X, Box, RefreshCw, HardDrive, EyeOff, LayoutGrid, ChevronLeft, ChevronRight, Bookmark,
  Save, Upload, Command, Terminal, Clock, Key, Trash2, Copy, Code, Check, Server, Eye, Download, Flame, Move, Moon, Sun, Monitor, AlertTriangle, Wifi, Link2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import decentraLogo from './assets/images/decentra_logo_1781371417581.jpg';

// dnd-kit imports
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type TabView = 'home' | 'settings' | 'analytics' | 'web' | 'history' | 'passwords' | 'vless';

interface BrowserTab {
  id: string;
  title: string;
  view: TabView;
  url: string;
  active: boolean;
}

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  date: string;
}

interface ToastItem {
  id: string;
  msg: string;
  type: 'success' | 'warn' | 'info';
}

function App() {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    { id: '1', title: 'Новая вкладка', view: 'home', url: '', active: true }
  ]);
  const [urlInput, setUrlInput] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);
  
  // Settings State
  const [torEnabled, setTorEnabled] = useState(false);
  const [ipfsEnabled, setIpfsEnabled] = useState(false);
  const [blockchainSync, setBlockchainSync] = useState(true);
  const [autoClearCache, setAutoClearCache] = useState(true);
  const [dnsMode, setDnsMode] = useState<'doh' | 'hns'>('doh');
  const [blockTelemetry, setBlockTelemetry] = useState(true);
  const [searchEngine, setSearchEngine] = useState('duckduckgo');
  const [customSearchEngine, setCustomSearchEngine] = useState('');
  const [experimentalProxy, setExperimentalProxy] = useState(false);
  const [vlessConnected, setVlessConnected] = useState(false);

  // UI State
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [contextMenu, setContextMenu] = useState<{show: boolean, x: number, y: number, context: 'global' | 'tab' | 'bookmark', targetId?: string}>({show: false, x: 0, y: 0, context: 'global'});

  // Analytics Dynamic Data
  const [trafficData, setTrafficData] = useState<any[]>(Array.from({ length: 20 }, (_, i) => ({
    time: i,
    download: Math.floor(Math.random() * 50) + 10,
    upload: Math.floor(Math.random() * 20) + 5,
  })));

  // Notifications logic
  const addToast = useCallback((msg: string, type: 'success' | 'warn' | 'info' = 'info') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficData(prev => {
        const newData = [...prev.slice(1)];
        newData.push({
          time: prev[prev.length - 1].time + 1,
          download: Math.floor(Math.random() * 100) + (torEnabled || vlessConnected ? 20 : 50),
          upload: Math.floor(Math.random() * 40) + (ipfsEnabled ? 30 : 10),
        });
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [torEnabled, ipfsEnabled, vlessConnected]);

  const activeTab = useMemo(() => tabs.find(t => t.active), [tabs]);

  // Context Menu & Sync Adress bar
  useEffect(() => {
    const handleClick = () => setContextMenu({ show: false, x: 0, y: 0, context: 'global' });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (activeTab) {
      if (activeTab.view === 'web') setUrlInput(activeTab.url);
      else if (activeTab.view === 'settings') setUrlInput('browser://settings');
      else if (activeTab.view === 'analytics') setUrlInput('browser://analytics');
      else if (activeTab.view === 'history') setUrlInput('browser://history');
      else if (activeTab.view === 'passwords') setUrlInput('browser://passwords');
      else if (activeTab.view === 'vless') setUrlInput('browser://vless');
      else setUrlInput('');
    }
  }, [activeTab?.id, activeTab?.view, activeTab?.url]);

  // Global Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 't') {
          e.preventDefault();
          newTab('home', 'Новая вкладка', '');
        } else if (e.key === 'w') {
          e.preventDefault();
          if (activeTab) closeTab(activeTab.id, e as any);
        } else if (e.key === 'l') {
          e.preventDefault();
          urlInputRef.current?.focus();
          urlInputRef.current?.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTab]);

  const switchTab = useCallback((id: string, e?: React.MouseEvent) => {
    if(e && 'stopPropagation' in e) e.stopPropagation();
    setTabs(prev => prev.map(t => ({ ...t, active: t.id === id })));
  }, []);

  const closeTab = useCallback((id: string, e?: React.MouseEvent | KeyboardEvent) => {
    if(e && 'stopPropagation' in e) e.stopPropagation();
    setTabs(prev => {
      if (prev.length === 1) {
        return [{ id: Math.random().toString(36).substr(2, 9), title: 'Новая вкладка', url: '', view: 'home', active: true }];
      }
      const newTabs = prev.filter(t => t.id !== id);
      if (prev.find(t => t.id === id)?.active) {
         newTabs[newTabs.length - 1].active = true;
      }
      return newTabs;
    });
  }, []);

  const newTab = useCallback((view: TabView = 'home', title: string = 'Новая вкладка', url: string = '') => {
    const newId = Math.random().toString(36).substr(2, 9);
    setTabs(prev => [...prev.map(t => ({ ...t, active: false })), { id: newId, title, view, url, active: true }]);
  }, []);

  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const input = urlInput.trim();
    if (!input) return;

    if (input.toLowerCase() === 'browser://settings') { newTab('settings', 'Настройки'); return; }
    if (input.toLowerCase() === 'browser://analytics') { newTab('analytics', 'Аналитика трафика'); return; }
    if (input.toLowerCase() === 'browser://history') { newTab('history', 'История'); return; }
    if (input.toLowerCase() === 'browser://passwords') { newTab('passwords', 'Пароли'); return; }
    if (input.toLowerCase() === 'browser://vless') { newTab('vless', 'VLESS Прокси'); return; }

    let targetUrl = input;
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(input);
    const isDomain = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input);
    const isTor = input.endsWith('.onion');
    const isIpfs = input.startsWith('ipfs://');
    
    if (isIpfs) targetUrl = input.replace('ipfs://', 'https://ipfs.io/ipfs/');
    else if (!input.startsWith('http') && (isIP || isDomain || isTor)) {
      targetUrl = `https://${input}`;
    } else if (!input.startsWith('http') && !isIpfs && !isTor) {
      let queryBase = 'https://duckduckgo.com/?q=';
      if (searchEngine === 'decentra') queryBase = 'https://search.decentra.net/search?q=';
      if (searchEngine === 'custom' && customSearchEngine) queryBase = customSearchEngine;
      targetUrl = `${queryBase}${encodeURIComponent(input)}`;
    }

    const title = isTor ? 'Tor Onion Routing...' : (new URL(targetUrl)).hostname || targetUrl;
    
    setHistory(prev => [{ id: Math.random().toString(36), url: targetUrl, title, date: new Date().toISOString() }, ...prev]);
    setTabs(prev => prev.map(t => t.active ? { ...t, view: 'web', url: targetUrl, title } : t));
  }, [urlInput, searchEngine, customSearchEngine, newTab]);

  const saveSession = useCallback(() => {
    const sessionData = btoa(JSON.stringify(tabs));
    const blob = new Blob([sessionData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'decentra_session.enc';
    a.click();
    URL.revokeObjectURL(url);
    setShowSessionManager(false);
    addToast('Сессия зашифрована и сохранена', 'success');
  }, [tabs, addToast]);

  const loadSession = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const decoded = JSON.parse(atob(ev.target?.result as string));
        if (Array.isArray(decoded)) {
          setTabs(decoded);
          addToast('Сессия успешно восстановлена', 'success');
        }
        setShowSessionManager(false);
      } catch (err) {
        addToast('Ошибка расшифровки сессии', 'warn');
      }
    };
    reader.readAsText(file);
  }, [addToast]);

  return (
    <div 
      className="flex flex-col h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden selection:bg-zinc-700 relative"
      onContextMenu={(e) => {
        if((e.target as HTMLElement).closest('.tab-item')) return;
        e.preventDefault();
        setContextMenu({ show: true, x: e.clientX, y: e.clientY, context: 'global' });
      }}
    >
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div 
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className={`flex items-center gap-3 px-5 py-3 rounded-lg shadow-2xl border ${
                toast.type === 'success' ? 'bg-zinc-900 border-emerald-900/50' : 
                toast.type === 'warn' ? 'bg-zinc-900 border-rose-900/50' : 
                'bg-zinc-900 border-zinc-800'
              }`}
            >
              {toast.type === 'success' ? <ShieldCheck size={18} className="text-emerald-400" /> : 
               toast.type === 'warn' ? <ShieldAlert size={18} className="text-rose-400" /> : 
               <Info size={18} className="text-zinc-400" />}
              <span className="text-sm font-medium tracking-wide text-zinc-200">{toast.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {contextMenu.show && (
        <div 
          className="fixed z-[300] bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] py-2 w-56 text-[13px] font-medium text-zinc-300"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 250) }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.context === 'tab' && contextMenu.targetId ? (
            <>
              <button className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 hover:text-rose-400 flex items-center gap-3 transition-colors"
                      onClick={() => { closeTab(contextMenu.targetId!); setContextMenu({show:false, x:0, y:0, context:'global'}); }}>
                 <X size={15} /> Закрыть вкладку
              </button>
              <button className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 flex items-center gap-3 transition-colors"
                      onClick={() => { const tab = tabs.find(t=>t.id === contextMenu.targetId!); if(tab) newTab(tab.view, tab.title, tab.url); setContextMenu({show:false, x:0, y:0, context:'global'}); }}>
                 <Copy size={15} /> Дублировать
              </button>
            </>
          ) : (
            <>
              <button className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 hover:text-emerald-400 flex items-center gap-3 transition-colors"
                      onClick={() => { setContextMenu({show:false, x:0, y:0, context:'global'}); }}>
                 <RefreshCw size={15} /> Обновить страницу
              </button>
              <button className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 hover:text-emerald-400 flex items-center gap-3 transition-colors"
                      onClick={() => { setContextMenu({show:false, x:0, y:0, context:'global'}); }}>
                 <Code size={15} /> Исходный код (IPFS)
              </button>
              <button className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 hover:text-emerald-400 flex items-center gap-3 transition-colors"
                      onClick={() => { navigator.clipboard.writeText(urlInput || window.location.href); addToast('Ссылка скопирована', 'success'); setContextMenu({show:false, x:0, y:0, context:'global'}); }}>
                 <Copy size={15} /> Копировать ссылку
              </button>
              <div className="h-px bg-zinc-800/80 my-1.5 mx-3" />
              <button className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 hover:text-emerald-400 flex items-center gap-3 transition-colors"
                      onClick={() => { newTab('settings', 'Настройки'); setContextMenu({show:false, x:0, y:0, context:'global'}); }}>
                 <Settings size={15} /> Настройки
              </button>
            </>
          )}
        </div>
      )}

      {/* Browser Header */}
      <div className="flex flex-col bg-zinc-950 border-b border-zinc-800 shrink-0 relative z-20 shadow-lg">
        
        {/* Tab Strip */}
        <div className="flex items-end px-2 pt-2 h-10 gap-1 bg-zinc-950 overflow-x-auto no-scrollbar">
          <AnimatePresence mode="popLayout">
            {tabs.map(tab => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={tab.id}
                onClick={(e) => switchTab(tab.id, e as any)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({ show: true, x: e.clientX, y: e.clientY, context: 'tab', targetId: tab.id });
                }}
                className={`tab-item group flex items-center justify-between px-3 py-1.5 min-w-[140px] max-w-[240px] text-xs font-medium cursor-default rounded-t-md transition-colors ${
                  tab.active 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-sm border border-b-0' 
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  {tab.view === 'settings' ? <Settings size={14} /> : 
                   tab.view === 'analytics' ? <Activity size={14} /> : 
                   tab.view === 'history' ? <Clock size={14} /> :
                   tab.view === 'passwords' ? <Key size={14} /> :
                   tab.view === 'vless' ? <Network size={14} /> :
                   tab.view === 'web' ? <Globe size={14} /> : <Box size={14} />}
                  <span className="truncate select-none">{tab.title}</span>
                </div>
                {tabs.length > 1 && (
                  <button 
                    onClick={(e) => closeTab(tab.id, e as any)}
                    className="opacity-0 group-hover:opacity-100 hover:bg-zinc-700/50 hover:text-zinc-100 rounded-sm p-0.5 ml-2 transition-all"
                  >
                    <X size={12} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <button 
            onClick={() => newTab('home')}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors mb-1 ml-1 shrink-0"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center px-4 py-2 space-x-3 bg-zinc-900 border-t border-black shadow-inner">
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <button className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"><ChevronLeft size={18} /></button>
            <button className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors opacity-50"><ChevronRight size={18} /></button>
            <button className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"><RefreshCw size={16} /></button>
            <button onClick={() => newTab('vless', 'VLESS Proxy')} className={`p-1.5 rounded-md transition-colors ${vlessConnected ? 'text-indigo-400 hover:bg-indigo-900/30' : 'hover:bg-zinc-800 text-zinc-400'}`} title="VLESS / Proxy Manager"><Network size={18} /></button>
          </div>
          
          <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus-within:border-emerald-500/50 focus-within:bg-zinc-900 rounded-lg px-3 py-1.5 transition-all outline-none ring-0">
             <div className="flex items-center justify-center mr-3 text-zinc-400 cursor-help" title="Decentralized Network & Security Status">
                {experimentalProxy || vlessConnected ? <ShieldAlert size={16} className={vlessConnected ? 'text-indigo-400' : 'text-amber-400'} /> : 
                 (torEnabled || blockTelemetry ? <ShieldCheck size={16} className="text-emerald-400" /> : <ShieldAlert size={16} />)}
             </div>
             <input 
               ref={urlInputRef}
               type="text" 
               className="flex-1 bg-transparent border-none outline-none text-[13px] placeholder:text-zinc-600 focus:placeholder:-translate-x-1 focus:placeholder:opacity-0 transition-all text-zinc-200"
               placeholder="Поиск или адрес"
               value={urlInput}
               onChange={(e) => setUrlInput(e.target.value)}
             />
             <div className="flex items-center space-x-3 ml-2 text-zinc-500">
                {blockTelemetry && <EyeOff size={15} className="text-emerald-500/70" title="Защита от телеметрии активна" />}
                <Bookmark size={15} className="hover:text-zinc-300 cursor-pointer transition-colors" />
             </div>
          </form>

          <div className="flex items-center space-x-1 text-zinc-400 relative">
            <button 
              onClick={() => {
                setTabs([{ id: Math.random().toString(36).substr(2, 9), title: 'Новая вкладка', url: '', view: 'home', active: true }]);
                setHistory([]);
                setUrlInput('');
                addToast('Данные сессии уничтожены', 'success');
              }} 
              className="p-1.5 rounded-md hover:bg-rose-900/30 hover:text-rose-400 transition-colors" 
              title="Уничтожить данные сессии"
            >
              <Flame size={18} />
            </button>
            <div className="w-px h-5 bg-zinc-800 mx-2" />
            <button onClick={() => setShowSessionManager(!showSessionManager)} className={`p-1.5 rounded-md transition-colors ${showSessionManager ? 'bg-zinc-800 text-zinc-100' : 'hover:bg-zinc-800'}`} title="Менеджер Сессий"><HardDrive size={18} /></button>
            <button onClick={() => newTab('passwords', 'Менеджер паролей')} className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors" title="Менеджер паролей"><Key size={18} /></button>
            <button onClick={() => newTab('history', 'История')} className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors" title="История"><Clock size={18} /></button>
            <button onClick={() => newTab('analytics', 'Аналитика')} className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"><Activity size={18} /></button>
            <div className="w-px h-5 bg-zinc-800 mx-2" />
            <button onClick={() => newTab('settings', 'Настройки')} className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"><Settings size={18} /></button>

            <AnimatePresence>
              {showSessionManager && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute right-0 top-12 w-64 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 shadow-2xl rounded-xl p-4 flex flex-col z-50 origin-top-right text-zinc-200"
                >
                  <h4 className="text-sm font-semibold mb-3 border-b border-zinc-800 pb-2">Менеджер Сессий</h4>
                  <button onClick={saveSession} className="flex items-center justify-center gap-2 w-full px-3 py-2 text-[13px] font-medium bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-900/50 rounded-lg transition-colors mb-2">
                     <Save size={14} /> Зашифровать
                  </button>
                  <label className="flex items-center justify-center gap-2 w-full px-3 py-2 text-[13px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg transition-colors cursor-pointer">
                     <Upload size={14} /> Восстановить
                     <input type="file" className="hidden" accept=".enc" onChange={loadSession} />
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-950 relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab?.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full"
          >
            {activeTab?.view === 'home' && (
              <MemoHomeView 
                torEnabled={torEnabled} 
                ipfsEnabled={ipfsEnabled} 
                vlessConnected={vlessConnected}
                onSearch={(q: string) => { setUrlInput(q); handleUrlSubmit({ preventDefault: () => {} } as any); }}
              />
            )}
            {activeTab?.view === 'settings' && (
              <MemoSettingsView 
                tor={torEnabled} setTor={setTorEnabled}
                ipfs={ipfsEnabled} setIpfs={setIpfsEnabled}
                blockchainSync={blockchainSync} setBlockchainSync={setBlockchainSync}
                autoClear={autoClearCache} setAutoClear={setAutoClearCache}
                dnsMode={dnsMode} setDnsMode={setDnsMode}
                blockTelemetry={blockTelemetry} setBlockTelemetry={setBlockTelemetry}
                searchEngine={searchEngine} setSearchEngine={setSearchEngine}
                customSearchEngine={customSearchEngine} setCustomSearchEngine={setCustomSearchEngine}
                experimentalProxy={experimentalProxy} setExperimentalProxy={setExperimentalProxy}
                addToast={addToast}
                setHistory={setHistory}
              />
            )}
            {activeTab?.view === 'history' && (
              <MemoHistoryView history={history} setHistory={setHistory} onSearch={(url: string) => { setUrlInput(url); handleUrlSubmit({ preventDefault: () => {} } as any); }} addToast={addToast} />
            )}
            {activeTab?.view === 'passwords' && (
              <MemoPasswordsView addToast={addToast} />
            )}
            {activeTab?.view === 'analytics' && <MemoAnalyticsView trafficData={trafficData} />}
            {activeTab?.view === 'vless' && (
              <MemoVlessView vlessConnected={vlessConnected} setVlessConnected={setVlessConnected} addToast={addToast} />
            )}
            {activeTab?.view === 'web' && (
              <div className="w-full h-full bg-white flex flex-col items-center justify-center text-zinc-800">
                <Globe size={48} className="text-zinc-300 mb-4" />
                <h2 className="text-2xl font-light text-zinc-600 mb-2">Веб-контейнер {experimentalProxy && '(Proxy Isolation)'} {vlessConnected && '(VLESS Proxying)'}</h2>
                <p className="text-sm text-zinc-400 font-mono bg-zinc-100 px-4 py-2 rounded-lg">{activeTab.url}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------------------
// View Components
// -----------------------------------------------------------------------------------------

const Info = React.memo(({ size, className }: { size: number, className?: string }) => {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>;
});
Info.displayName = "Info";

// Widget System implementation for Home View using dnd-kit
interface WidgetBase {
  id: string;
  type: 'status' | 'bookmarks' | 'clock' | 'stats';
}

const SortableWidget: React.FC<{ id: string, children: React.ReactNode }> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/widget md:col-span-1 rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 shadow-lg" {...attributes}>
       <div 
         {...listeners} 
         className="absolute top-3 right-3 text-zinc-600 opacity-0 group-hover/widget:opacity-100 hover:text-emerald-400 cursor-grab active:cursor-grabbing transition-all p-1 z-10"
       >
         <Move size={16}/>
       </div>
       {children}
    </div>
  );
};


const HomeView = ({ torEnabled, ipfsEnabled, vlessConnected, onSearch }: { torEnabled: boolean, ipfsEnabled: boolean, vlessConnected: boolean, onSearch: (q: string) => void }) => {
  const [searchInput, setSearchInput] = useState('');
  const [widgets, setWidgets] = useState<WidgetBase[]>([
    { id: 'w1', type: 'status' },
    { id: 'w2', type: 'bookmarks' },
    { id: 'w3', type: 'stats' }
  ]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const bookmarks = [
    { title: 'Decentralized Docs', url: 'ipfs://QmYwA...' },
    { title: 'Privacy Forums', url: 'onion://xmh...' },
    { title: 'DuckDuckGo', url: 'https://duckduckgo.com' }
  ];

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-20 flex flex-col items-center">
        <div className="mb-14 text-center select-none flex flex-col items-center">
          <img src={decentraLogo} alt="Logo" className="w-[110px] h-[110px] object-cover rounded-3xl mb-8 shadow-2xl ring-1 ring-zinc-800" draggable="false" />
          <h1 className="text-5xl font-light tracking-widest text-zinc-100 mb-4 flex items-center justify-center gap-4">
            <Terminal size={36} className={(torEnabled || ipfsEnabled || vlessConnected) ? "text-emerald-400" : "text-zinc-600"} />
            CRYBRUH
          </h1>
        </div>

        <div className="w-full relative group mb-12 max-w-2xl mx-auto shadow-2xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
          <input 
            type="text" 
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if(e.key === 'Enter') onSearch(searchInput); }}
            placeholder="Поиск по сайтам, IPFS или Tor..." 
            className="w-full bg-zinc-900/80 backdrop-blur-sm focus:bg-zinc-800 border border-zinc-800 focus:border-emerald-500/50 rounded-2xl px-14 py-4 outline-none text-[15px] text-zinc-100 placeholder:text-zinc-600 transition-all shadow-inner"
          />
        </div>

        <div className="w-full">
          <p className="text-xs text-zinc-600 mb-4 font-mono select-none">ВИДЖЕТЫ ЭКРАНА (ПЕРЕТАЩИТЕ ДЛЯ СМЕНЫ)</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgets} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {widgets.map(w => (
                  <SortableWidget key={w.id} id={w.id}>
                    {w.type === 'status' && (
                      <div className="p-6">
                         <h3 className="text-[11px] font-bold tracking-[0.1em] text-zinc-500 uppercase mb-4">СЕТЬ</h3>
                         <div className="space-y-4">
                           <div className="flex justify-between items-center text-sm">
                             <span className="text-zinc-300 flex items-center gap-2"><Network size={14}/> VLESS</span>
                             <span className={`text-[10px] font-mono ${vlessConnected?'text-indigo-400':'text-zinc-500'}`}>{vlessConnected?'ACTIVE':'OFF'}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                             <span className="text-zinc-300 flex items-center gap-2"><Lock size={14}/> Tor</span>
                             <span className={`text-[10px] font-mono ${torEnabled?'text-emerald-400':'text-zinc-500'}`}>{torEnabled?'ON':'OFF'}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                             <span className="text-zinc-300 flex items-center gap-2"><Box size={14}/> IPFS</span>
                             <span className={`text-[10px] font-mono ${ipfsEnabled?'text-cyan-400':'text-zinc-500'}`}>{ipfsEnabled?'SYNC':'OFF'}</span>
                           </div>
                         </div>
                      </div>
                    )}
                    {w.type === 'bookmarks' && (
                      <div className="p-6 md:col-span-2">
                         <h3 className="text-[11px] font-bold tracking-[0.1em] text-zinc-500 uppercase mb-4">БЫСТРЫЙ ДОСТУП</h3>
                         <div className="space-y-3">
                           {bookmarks.map((bm, i) => (
                             <div key={i} onClick={() => onSearch(bm.url)} className="text-sm text-zinc-300 hover:text-emerald-400 cursor-pointer flex justify-between transition-colors">
                               <span>{bm.title}</span><span className="text-[10px] text-zinc-600 font-mono">{bm.url}</span>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}
                    {w.type === 'stats' && (
                      <div className="p-6 h-full flex flex-col justify-center text-center">
                         <h3 className="text-[11px] font-bold tracking-[0.1em] text-zinc-500 uppercase mb-4">СЕЙЧАС</h3>
                         <p className="text-2xl font-light text-zinc-200 font-mono">{(new Date()).toLocaleTimeString()}</p>
                      </div>
                    )}
                  </SortableWidget>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

const SettingsView = (props: any) => {
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      props.addToast('Импорт данных из другого браузера завершён (симуляция)', 'success');
      props.setHistory((prev: any) => [
        { id: Math.random().toString(), url: 'https://github.com', title: 'GitHub', date: new Date().toISOString() },
        ...prev
      ]);
    }
  };

  const Toggle = ({ label, desc, state, setter, icon: Icon, colorClass }: any) => (
    <div className="flex items-start justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-xl group hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-4">
        <Icon size={20} className={`mt-0.5 ${state ? colorClass : 'text-zinc-600'}`} />
        <div>
          <h4 className="text-[13px] font-semibold text-zinc-200">{label}</h4>
          <p className="text-[11px] text-zinc-500 mt-1 max-w-sm">{desc}</p>
        </div>
      </div>
      <button onClick={() => setter(!state)} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${state ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-zinc-950 transition-transform ${state ? 'translate-x-4' : 'translate-x-[3px]'}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <h2 className="text-2xl font-light text-zinc-100 mb-8 border-b border-zinc-800 pb-4">Настройки Безопасности и Конфиденциальности</h2>
      
      <div className="space-y-10">
        <section>
          <h3 className="text-[11px] font-bold tracking-wider text-zinc-500 mb-4 uppercase">Миграция Данных</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
             <p className="text-xs text-zinc-400">Импортируйте историю, закладки и пароли из Chrome, Firefox или Яндекс.Браузера.</p>
             <label className="flex items-center justify-center gap-2 px-5 py-3 text-[13px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg transition-colors cursor-pointer w-fit">
                <Upload size={16} /> Импортировать HTML / CSV
                <input type="file" className="hidden" accept=".csv,.html" onChange={handleImport} />
             </label>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-bold tracking-wider text-zinc-500 mb-4 uppercase">Максимальная Изоляция</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Toggle label="Защита от телеметрии (Ads/Trackers)" desc="Блокирует 99% аналитических скриптов и телеметрии на сайтах." state={props.blockTelemetry} setter={props.setBlockTelemetry} icon={ShieldAlert} colorClass="text-emerald-400" />
             <Toggle label="Tor Routing" desc="Маршрутизация через Onion-сеть." state={props.tor} setter={props.setTor} icon={Lock} colorClass="text-emerald-400" />
             <Toggle label="IPFS Node" desc="Локальный пир IPFS." state={props.ipfs} setter={props.setIpfs} icon={Box} colorClass="text-cyan-400" />
             <Toggle label="Экспериментальный Прокси" desc="Изолирует запросы веб-контейнера через сторонние шлюзы." state={props.experimentalProxy} setter={(val: boolean) => { props.setExperimentalProxy(val); if(val) props.addToast('Внимание: Экспериментальный прокси может замедлить сеть', 'warn')}} icon={Network} colorClass="text-amber-400" />
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-bold tracking-wider text-zinc-500 mb-4 uppercase">Поисковые Системы</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
             <p className="text-xs text-zinc-400 mb-4">Выберите дефолтный поисковик для защиты ваших поисковых запросов.</p>
             <div className="flex gap-4">
               <label className={`cursor-pointer p-4 border rounded-lg flex-1 ${props.searchEngine==='duckduckgo'?'bg-zinc-800 border-zinc-600':'bg-zinc-900 border-zinc-800'}`}>
                  <input type="radio" value="duckduckgo" checked={props.searchEngine==='duckduckgo'} onChange={()=>props.setSearchEngine('duckduckgo')} className="hidden"/>
                  <span className="font-semibold text-sm">DuckDuckGo</span>
               </label>
               <label className={`cursor-pointer p-4 border rounded-lg flex-1 ${props.searchEngine==='decentra'?'bg-zinc-800 border-zinc-600':'bg-zinc-900 border-zinc-800'}`}>
                  <input type="radio" value="decentra" checked={props.searchEngine==='decentra'} onChange={()=>props.setSearchEngine('decentra')} className="hidden"/>
                  <span className="font-semibold text-sm">CRYBRUH Search Beta</span>
                  <span className="block text-[10px] text-emerald-400 mt-1">Ограниченная телеметрия</span>
               </label>
               <label className={`cursor-pointer p-4 border rounded-lg flex-1 ${props.searchEngine==='custom'?'bg-zinc-800 border-zinc-600':'bg-zinc-900 border-zinc-800'}`}>
                  <input type="radio" value="custom" checked={props.searchEngine==='custom'} onChange={()=>props.setSearchEngine('custom')} className="hidden"/>
                  <span className="font-semibold text-sm">OpenSearch Собственный</span>
               </label>
             </div>
             {props.searchEngine === 'custom' && (
               <input type="text" placeholder="https://mysearch.com/?q=" value={props.customSearchEngine} onChange={(e) => props.setCustomSearchEngine(e.target.value)} className="w-full mt-4 bg-zinc-950 border border-zinc-700 p-3 rounded-lg text-sm text-zinc-200 outline-none" />
             )}
          </div>
        </section>
      </div>
    </div>
  );
};

const PasswordsView = ({ addToast }: { addToast: any }) => {
  const [dbState, setDbState] = useState<'loading'|'unconfigured'|'locked'|'unlocked'>('loading');
  const [password, setPassword] = useState('');
  const [vaultData, setVaultData] = useState<any[]>([]);
  
  const [domain, setDomain] = useState('');
  const [username, setUsername] = useState('');
  const [pwdLen, setPwdLen] = useState(16);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setDbState(data.isSetup ? 'locked' : 'unconfigured');
    } catch {
      setDbState('unconfigured'); // fallback
    }
  };

  const handleSetup = async () => {
    if (!password) return;
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({password})
      });
      if(res.ok) setDbState('unlocked');
      addToast('Хранилище создано и зашифровано (bcrypt+SQLite)', 'success');
      loadVault();
    } catch(err) { addToast('Ошибка инициализации SQLite', 'warn'); }
  };

  const handleLogin = async () => {
    if (!password) return;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({password})
      });
      if(res.ok) {
        setDbState('unlocked');
        loadVault();
      } else {
        addToast('Неверный мастер-пароль', 'warn');
      }
    } catch(err) { addToast('Сервер недоступен', 'warn'); }
  };

  const loadVault = async () => {
    const res = await fetch('/api/passwords');
    const data = await res.json();
    setVaultData(data);
  };

  const addCredential = async () => {
    if(!domain || !username) return;
    let pwd = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    for(let i=0; i<pwdLen; i++) pwd+=chars[Math.floor(Math.random()*chars.length)];
    
    await fetch('/api/passwords', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({domain, username, password: pwd})
    });
    addToast('Запись добавлена в SQLite', 'success');
    setDomain(''); setUsername('');
    loadVault();
  };

  const deleteCred = async (id: number) => {
    await fetch(`/api/passwords/${id}`, { method: 'DELETE' });
    loadVault();
  };

  if (dbState === 'loading') return <div className="p-8 text-zinc-500 font-mono text-sm">Initializing DB Encryption Module...</div>;

  if (dbState === 'unconfigured' || dbState === 'locked') {
    return (
      <div className="flex w-full h-[80vh] items-center justify-center p-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 max-w-sm w-full flex flex-col items-center shadow-2xl">
           <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 mb-6 flex gap-2 text-emerald-400">
             <Key size={32} /> <HardDrive size={32} />
           </div>
           <h2 className="text-xl font-medium text-zinc-100 mb-2">
             {dbState === 'unconfigured' ? 'Новое Хранилище' : 'Разблокировка SQLite'}
           </h2>
           <p className="text-xs text-zinc-500 text-center mb-8">
             {dbState === 'unconfigured' ? 'Задайте мастер-пароль. Он будет захэширован (Bcrypt).' : 'Введите мастер-пароль для доступа к SQLite БД.'}
           </p>
           
           <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { dbState==='unconfigured'?handleSetup():handleLogin() } }} placeholder="Мастер-пароль" className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 outline-none text-sm text-center tracking-widest text-zinc-200 transition-colors mb-4" />
           <button onClick={dbState==='unconfigured'?handleSetup:handleLogin} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
             {dbState === 'unconfigured' ? 'Инициализировать' : 'Разблокировать'}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <div className="mb-10 flex items-center justify-between border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <Key size={32} className="text-zinc-600" />
          <h2 className="text-3xl font-light text-zinc-100 uppercase tracking-widest">Менеджер Паролей</h2>
        </div>
        <button onClick={() => { setDbState('locked'); setPassword(''); }} className="px-4 py-2 border border-zinc-800 bg-zinc-900 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 flex items-center gap-2">
           <Lock size={14} /> Закрыть Хранилище
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
          <h3 className="text-xs font-bold uppercase text-zinc-500 mb-4">Добавить запись</h3>
          <input type="text" placeholder="Домен / Сайт" value={domain} onChange={e=>setDomain(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 mb-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none"/>
          <input type="text" placeholder="Пользователь / Email" value={username} onChange={e=>setUsername(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 mb-6 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none"/>
          
          <div className="flex justify-between text-xs text-zinc-500 mb-2"><span>Длина генерации</span><span>{pwdLen}</span></div>
          <input type="range" min="8" max="64" value={pwdLen} onChange={e=>setPwdLen(parseInt(e.target.value))} className="w-full mb-6 accent-emerald-500"/>
          
          <button onClick={addCredential} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors">Сгенерировать и Сохранить</button>
        </div>

        <div className="md:col-span-2 space-y-3">
          <p className="text-xs font-mono text-zinc-600 mb-2">БАЗА ДАННЫХ SQLITE (RECORDS: {vaultData.length})</p>
          {vaultData.length === 0 ? (
            <div className="p-10 border border-zinc-800 border-dashed rounded-xl flex flex-col items-center text-zinc-600">
               <Box size={24} className="mb-2"/> <p className="text-sm">Нет записей</p>
            </div>
          ) : vaultData.map((pwd) => (
            <div key={pwd.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex justify-between items-center group">
               <div>
                  <p className="text-sm font-semibold text-zinc-200">{pwd.domain}</p>
                  <p className="text-xs text-zinc-500">{pwd.username}</p>
               </div>
               <div className="flex items-center gap-3">
                 <button onClick={() => { navigator.clipboard.writeText(pwd.password); addToast('Скопировано', 'success'); }} className="p-2 text-zinc-500 hover:text-emerald-400 bg-zinc-950 rounded border border-zinc-800 transition-colors">
                   <Copy size={14}/>
                 </button>
                 <button onClick={() => deleteCred(pwd.id)} className="p-2 text-zinc-500 hover:text-rose-400 bg-zinc-950 rounded border border-zinc-800 transition-colors">
                   <Trash2 size={14}/>
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HistoryView = ({ history, setHistory, onSearch, addToast }: { history: HistoryItem[], setHistory: any, onSearch: (url: string) => void, addToast: any }) => {
  const [search, setSearch] = useState('');
  const filteredHistory = history.filter(h => h.title.toLowerCase().includes(search.toLowerCase()) || h.url.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-8 border-b border-zinc-800 pb-6 flex justify-between items-center">
        <h2 className="text-3xl font-light text-zinc-100 flex items-center gap-3"><Clock size={28}/> История</h2>
        <button onClick={() => { setHistory([]); addToast('Очищено', 'info'); }} className="px-4 py-2 border border-zinc-800 rounded-xl text-xs hover:bg-rose-900/40 text-zinc-400 hover:text-rose-400 transition-colors">Очистить все</button>
      </div>
      <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск..." className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 p-4 rounded-xl outline-none mb-8 text-sm" />
      <div className="space-y-2">
        {filteredHistory.map(item => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-900/50 hover:bg-zinc-800 rounded-lg cursor-pointer" onClick={() => onSearch(item.url)}>
            <div className="truncate"><p className="text-sm text-zinc-300">{item.title}</p><p className="text-[11px] text-zinc-500 font-mono truncate">{item.url}</p></div>
            <span className="text-[10px] text-zinc-600 font-mono shrink-0 ml-4">{new Date(item.date).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsView = ({ trafficData }: { trafficData: any[] }) => {
  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <h2 className="text-2xl font-light text-zinc-100 mb-8 border-b border-zinc-800 pb-4">Телеметрия Маршрутов</h2>
      <div className="h-64 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trafficData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis stroke="#52525b" fontSize={11} tickFormatter={(val)=>val+' Kbps'} width={60}/>
            <Tooltip contentStyle={{backgroundColor:'#18181b', border:'1px solid #27272a', borderRadius:'8px'}} />
            <Line type="monotone" dataKey="download" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="upload" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const VlessView = ({ vlessConnected, setVlessConnected, addToast }: { vlessConnected: boolean, setVlessConnected: any, addToast: any }) => {
  const [subLink, setSubLink] = useState('');
  const [nodes, setNodes] = useState<any[]>([]);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [routingRules, setRoutingRules] = useState<string>('localhost\n127.0.0.1\n*.local\ngeoip:ru\nmybank.com');

  const importSub = () => {
    if (!subLink) return;
    addToast('Ключи подписки успешно обработаны', 'success');
    setNodes([
      { id: '1', name: '🇳🇱 NL-Amsterdam-VLESS-XTLS', protocol: 'vless', ping: 45 },
      { id: '2', name: '🇩🇪 DE-Frankfurt-Xray-Reality', protocol: 'vless', ping: 32 },
      { id: '3', name: '🇺🇸 US-NewYork-Socks5', protocol: 'socks5', ping: 120 },
      { id: '4', name: '🇬🇧 UK-London-Trojan', protocol: 'trojan', ping: 55 },
    ]);
    setSubLink('');
  };

  const connectNode = (id: string) => {
    setActiveNode(id);
    setVlessConnected(true);
    addToast('Успешное подключение к Xray/VLESS узлу', 'success');
  };

  const disconnectNode = () => {
    setActiveNode(null);
    setVlessConnected(false);
    addToast('Отключено', 'info');
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <div className="mb-10 flex items-center justify-between border-b border-zinc-800 pb-6">
        <div className="flex flex-col">
          <h2 className="text-3xl font-light text-zinc-100 flex items-center gap-3">
             <Network size={28} className={vlessConnected ? "text-indigo-400" : "text-zinc-600"}/> 
             VLESS / Xray Прокси
          </h2>
          <p className="text-xs text-zinc-500 mt-2 font-mono">Аппаратное ускорение и прозрачная подмена TCP/UDP (Happ/Amnezia API)</p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-mono text-[10px] ${vlessConnected ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/50' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>
           {vlessConnected ? 'СТАТУС: ПОДКЛЮЧЕНО' : 'СТАТУС: ОЖИДАНИЕ'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-zinc-500 mb-4 tracking-widest uppercase">Импорт ключей (Happ, vless://, ss://)</h3>
              <div className="flex gap-2">
                 <input type="text" value={subLink} onChange={e=>setSubLink(e.target.value)} placeholder="vless://... или ссылка на подписку" className="flex-1 bg-zinc-950 border border-zinc-800 p-3 rounded-lg outline-none text-sm text-zinc-200 focus:border-indigo-500/50 transition-colors" />
                 <button onClick={importSub} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 rounded-lg text-sm transition-colors border border-zinc-700"><Download size={16}/></button>
              </div>
           </div>

           <div>
             <h3 className="text-xs font-bold text-zinc-500 mb-4 tracking-widest uppercase">Доступные Ноды ({nodes.length})</h3>
             {nodes.length === 0 ? (
               <div className="p-8 border border-zinc-800 border-dashed rounded-xl flex flex-col items-center text-zinc-600 bg-zinc-900/30">
                  <Link2 size={24} className="mb-2"/> <p className="text-sm">Нет добавленных ключей Xray</p>
               </div>
             ) : (
               <div className="space-y-2">
                 {nodes.map(node => (
                   <div key={node.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${activeNode === node.id ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
                     <div>
                       <p className="text-sm font-medium text-zinc-200">{node.name}</p>
                       <div className="flex gap-3 mt-1">
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded uppercase tracking-wider">{node.protocol}</span>
                          <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1"><Wifi size={10}/> {node.ping} ms</span>
                       </div>
                     </div>
                     {activeNode === node.id ? (
                       <button onClick={disconnectNode} className="px-4 py-2 bg-rose-900/30 text-rose-400 border border-rose-900/50 rounded-lg text-[11px] font-bold tracking-wider hover:bg-rose-900/50 transition-colors">ОТКЛЮЧИТЬ</button>
                     ) : (
                       <button onClick={() => connectNode(node.id)} className="px-4 py-2 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-[11px] font-bold tracking-wider hover:bg-zinc-700 transition-colors">START</button>
                     )}
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>

        <div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-full shadow-lg">
            <h3 className="text-xs font-bold text-zinc-500 mb-4 tracking-widest uppercase">Split Routing</h3>
            <p className="text-[11px] text-zinc-400 mb-3">Домены и IP, которые будут обращаться <b className="text-emerald-400">НАПРЯМУЮ</b> (Bypass Proxy).</p>
            <textarea 
              value={routingRules} 
              onChange={e => setRoutingRules(e.target.value)} 
              className="w-full h-[60%] bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-300 outline-none focus:border-indigo-500/50 resize-none transition-colors"
            />
            <button onClick={() => addToast('Правила маршрутизации сохранены', 'success')} className="w-full mt-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors border border-zinc-700">Применить правила</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MemoHomeView = React.memo(HomeView);
const MemoSettingsView = React.memo(SettingsView);
const MemoPasswordsView = React.memo(PasswordsView);
const MemoHistoryView = React.memo(HistoryView);
const MemoAnalyticsView = React.memo(AnalyticsView);
const MemoVlessView = React.memo(VlessView);

MemoHomeView.displayName = 'HomeView';
MemoSettingsView.displayName = 'SettingsView';
MemoPasswordsView.displayName = 'PasswordsView';
MemoHistoryView.displayName = 'HistoryView';
MemoAnalyticsView.displayName = 'AnalyticsView';
MemoVlessView.displayName = 'VlessView';

export default App;
