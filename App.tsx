
import React, { useState, useEffect, useCallback } from 'react';
import { analyzeTopic, refreshNicheStrategy } from './services/geminiService';
import { AnalysisData, LogEntry, Strategy } from './types';

// Components
const StatCard: React.FC<{ label: string; value: string; icon?: string; accent?: boolean }> = ({ label, value, icon, accent }) => (
  <div className="glass rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden group print:border-gray-200 print:shadow-none">
    {accent && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse-red print:hidden"></div>}
    <div className="text-gray-400 text-xs font-medium uppercase tracking-wider print:text-gray-600">{label}</div>
    <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform print:text-black">{value}</div>
    {icon && <div className={`mt-2 ${accent ? 'text-red-500' : 'text-indigo-400'} print:hidden`}><i className={icon}></i></div>}
  </div>
);

const StrategyCard: React.FC<{ strategy: Strategy; onRefresh?: () => void; refreshing?: boolean }> = ({ strategy, onRefresh, refreshing }) => {
  const isNiche = strategy.type === 'niche';
  const borderColor = isNiche ? 'border-green-500/30' : 'border-red-500/30';
  const bgColor = isNiche ? 'bg-green-500/5' : 'bg-red-500/5';
  const tagColor = isNiche ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className={`relative rounded-xl p-5 flex flex-col space-y-4 border ${borderColor} ${bgColor} transition-all hover:translate-y-[-4px] print:border-gray-300 print:bg-white print:text-black print:break-inside-avoid shadow-sm`}>
      {refreshing && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
          <i className="fa-solid fa-spinner animate-spin text-white text-2xl"></i>
        </div>
      )}
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-white pr-8 print:text-black">{strategy.title}</h3>
        <div className="flex flex-col items-end space-y-2 print:hidden">
          <span className={`${tagColor} text-[10px] px-2 py-0.5 rounded font-bold uppercase text-white`}>
            {isNiche ? '니치' : '대중적'}
          </span>
          {isNiche && onRefresh && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRefresh(); }}
              className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 px-2 py-1 rounded border border-white/10 flex items-center space-x-1 transition-all active:scale-95"
              title="니치 전략 새로고침"
            >
              <i className="fa-solid fa-arrows-rotate"></i>
              <span>새로고침</span>
            </button>
          )}
        </div>
        <div className="hidden print:block text-[10px] font-bold border px-2 py-0.5 rounded uppercase">
          {isNiche ? 'NICHE' : 'GENERAL'}
        </div>
      </div>
      <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed print:text-gray-700 print:line-clamp-none">{strategy.description}</p>
      
      <div className="flex items-center space-x-4 text-xs">
        <div className="flex flex-col">
          <span className="text-gray-500 print:text-gray-500">경쟁도</span>
          <span className={strategy.competition === '높음' || strategy.competition === 'High' ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{strategy.competition}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 print:text-gray-500">난이도</span>
          <div className="flex space-x-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < strategy.difficulty ? 'bg-indigo-500' : 'bg-gray-700 print:bg-gray-200'}`}></div>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 print:text-gray-500">예상 CPM</span>
          <span className="text-indigo-300 font-bold print:text-indigo-700">{strategy.estimatedCpm}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-tight flex justify-between border-b border-white/10 pb-1 print:border-gray-200 print:text-gray-800">
          <span>콘텐츠 아이디어 (5)</span>
        </div>
        <ul className="space-y-1.5">
          {strategy.ideas.slice(0, 5).map((idea, idx) => (
            <li key={idx} className="text-xs text-gray-400 flex items-start space-x-2 print:text-gray-700">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>{idea}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function App() {
  const [topic, setTopic] = useState('교육');
  const [region, setRegion] = useState('South Korea');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copying, setCopying] = useState(false);
  const [refreshingNicheId, setRefreshingNicheId] = useState<number | null>(null);

  const addLog = useCallback((message: string, agent: string = '시스템 AI', type: LogEntry['type'] = 'info') => {
    setLogs(prev => [
      { id: Math.random().toString(36), agent, message, timestamp: new Date(), type },
      ...prev.slice(0, 19)
    ]);
  }, []);

  const handleAnalyze = async () => {
    if (!topic) return;
    setLoading(true);
    setData(null);
    setLogs([]);
    addLog(`분석 엔진 가동: ${topic} (${region})...`, '총괄 에이전트');
    
    try {
      addLog('시장 트렌드 및 CPM 데이터 분석 중...', 'CPM 분석가');
      addLog('경쟁 채널 환경 스캔 및 니치 탐색 중...', '경쟁 분석가');
      
      const result = await analyzeTopic(topic, region);
      
      addLog('분석 보고서 생성 완료.', '전략 전문가', 'success');
      setData(result);
    } catch (error) {
      addLog('데이터를 불러오는 중 오류가 발생했습니다.', '시스템', 'warning');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshNiche = async (index: number) => {
    if (!data || !topic) return;
    setRefreshingNicheId(index);
    addLog(`니치 전략 #${index + 1} 새로고침 요청됨...`, '니치 전문가');
    
    try {
      const newStrategy = await refreshNicheStrategy(topic, region);
      const newData = { ...data };
      newData.strategies[index] = newStrategy;
      setData(newData);
      addLog(`니치 전략 #${index + 1}이 새롭게 업데이트되었습니다.`, '니치 전문가', 'success');
    } catch (error) {
      addLog('니치 전략 업데이트 중 문제가 발생했습니다.', '시스템', 'warning');
    } finally {
      setRefreshingNicheId(null);
    }
  };

  const copyJson = () => {
    if (!data) return;
    setCopying(true);
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    addLog('데이터를 JSON 형식으로 클립보드에 복사했습니다.', '시스템', 'success');
    setTimeout(() => setCopying(false), 2000);
  };

  const exportPdf = () => {
    if (!data) return;
    addLog('분석 결과 리포트 PDF 출력을 시작합니다.', '시스템');
    // 실제 다운로드 느낌을 위해 약간의 딜레이 후 print 실행
    setTimeout(() => {
      window.print();
    }, 500);
  };

  useEffect(() => {
    handleAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:bg-white print:text-black">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0f0a1e] z-10 shrink-0 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-lg shadow-red-500/20">
            <i className="fa-brands fa-youtube text-white text-lg"></i>
          </div>
          <h1 className="text-lg font-bold tracking-tight hidden sm:block">
            유튜브 토픽 <span className="text-red-500 underline decoration-red-500/30">인사이트 AI</span>
          </h1>
        </div>

        <div className="flex-1 max-w-xl mx-8 flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 focus-within:border-indigo-500/50 transition-colors">
          <i className="fa-solid fa-search text-gray-500 mr-3"></i>
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="주제를 입력하세요..."
            className="bg-transparent border-none outline-none w-full text-sm text-gray-200 placeholder-gray-500"
          />
          <select 
            className="bg-transparent border-none outline-none text-xs text-indigo-400 font-bold cursor-pointer ml-2 hover:text-indigo-300"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="South Korea" className="bg-[#1a152e]">한국 (KR)</option>
            <option value="United States" className="bg-[#1a152e]">미국 (US)</option>
            <option value="Japan" className="bg-[#1a152e]">일본 (JP)</option>
            <option value="Global" className="bg-[#1a152e]">글로벌 (Global)</option>
          </select>
        </div>

        <button 
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 active:scale-95"
        >
          {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-bolt"></i>}
          <span>분석 실행</span>
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        {/* Sidebar Left */}
        <aside className="w-16 border-r border-white/5 flex flex-col items-center py-6 space-y-6 shrink-0 bg-[#0f0a1e] print:hidden">
          {[
            { icon: 'fa-solid fa-chart-line', label: '시장 트렌드' },
            { icon: 'fa-solid fa-hand-holding-dollar', label: '수익성 분석' },
            { icon: 'fa-solid fa-users', label: '경쟁 채널' },
            { icon: 'fa-solid fa-bullseye', label: '니치 발굴' },
            { icon: 'fa-solid fa-lightbulb', label: '창의적 아이디어' }
          ].map((item, i) => (
            <div key={i} className="group relative">
              <button className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-indigo-600/10 hover:text-indigo-400 transition-all">
                <i className={item.icon}></i>
              </button>
              <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 bg-indigo-600 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                {item.label}
              </div>
            </div>
          ))}
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8 print:p-0 print:overflow-visible">
          {loading && !data && (
            <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-80">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin shadow-2xl shadow-indigo-500/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fa-solid fa-robot text-indigo-400 text-2xl"></i>
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-indigo-400 font-bold text-lg animate-pulse">데이터 마이닝 및 전략 수립 중</p>
                <p className="text-gray-500 text-sm">최신 시장 트렌드와 수익성을 분석하고 있습니다...</p>
              </div>
            </div>
          )}

          {data && (
            <div className="max-w-6xl mx-auto space-y-10">
              {/* Analysis Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6 print:border-gray-300">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={`https://flagcdn.com/w40/${data.region.toLowerCase().includes('korea') ? 'kr' : data.region.toLowerCase().includes('united states') ? 'us' : data.region.toLowerCase().includes('japan') ? 'jp' : 'un'}.png`} 
                      className="w-8 h-6 object-cover rounded shadow-lg"
                      alt="region"
                    />
                    <h2 className="text-3xl font-extrabold text-white print:text-black">
                      <span className="text-indigo-400 print:text-indigo-600">{topic}</span> 분석 리포트
                    </h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="bg-indigo-500/10 text-indigo-400 text-xs px-3 py-1 rounded-full font-bold border border-indigo-500/20 print:border-gray-300 print:text-black">
                      {data.category}
                    </span>
                    <span className="text-green-500 font-bold flex items-center space-x-1.5">
                      <i className="fa-solid fa-dollar-sign"></i>
                      <span>CPM 범위: {data.cpmRange}</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-3 print:hidden">
                  <button 
                    onClick={copyJson}
                    className="glass px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex items-center space-x-2 active:scale-95 border border-white/10"
                  >
                    <i className={`fa-solid ${copying ? 'fa-check text-green-500' : 'fa-code text-indigo-400'}`}></i>
                    <span>{copying ? '복사 완료' : 'JSON 데이터 복사'}</span>
                  </button>
                  <button 
                    onClick={exportPdf}
                    className="bg-white/5 hover:bg-red-600/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 active:scale-95 border border-white/10 hover:border-red-500/30 text-gray-300 hover:text-red-400"
                  >
                    <i className="fa-solid fa-file-pdf"></i>
                    <span>PDF 리포트 저장</span>
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="유사 채널 수" value={data.stats.relatedChannels} icon="fa-solid fa-users-viewfinder" />
                <StatCard label="최근 게시 비디오" value={data.stats.relatedVideos} icon="fa-solid fa-video" />
                <StatCard label="채널 평균 구독자" value={data.stats.avgSubscribers} icon="fa-solid fa-user-check" />
                <StatCard label="시장 경쟁 강도" value={data.stats.competitionIntensity} accent={data.stats.competitionIntensity === '높음' || data.stats.competitionIntensity === 'High'} icon="fa-solid fa-fire-flame-curved" />
              </div>

              {/* Top Channels */}
              <div className="glass rounded-2xl p-6 border border-white/5 print:bg-white print:text-black print:border-gray-200">
                <div className="flex items-center space-x-2 mb-6 text-xs font-bold text-amber-500 uppercase tracking-widest border-l-2 border-amber-500 pl-3">
                  <i className="fa-solid fa-trophy"></i>
                  <span>주요 마켓 리더 및 경쟁자</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.topChannels.map((channel, i) => (
                    <a 
                      key={i} 
                      href={channel.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-4 bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 p-4 rounded-xl transition-all group print:border-gray-200 print:bg-gray-50"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
                        {channel.name[0]}
                      </div>
                      <div className="flex flex-col flex-1 truncate">
                        <span className="text-sm font-bold text-white print:text-black truncate">{channel.name}</span>
                        <span className="text-xs text-gray-500 font-medium">{channel.subscribers} 구독자</span>
                      </div>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-gray-700 group-hover:text-indigo-400 transition-colors print:hidden"></i>
                    </a>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="bg-gradient-to-br from-indigo-900/20 to-transparent border border-indigo-500/10 rounded-2xl p-8 relative overflow-hidden print:bg-white print:text-black print:border-gray-200 print:shadow-none">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <i className="fa-solid fa-brain text-8xl text-indigo-400"></i>
                </div>
                <h3 className="text-sm font-bold text-indigo-400 uppercase mb-6 flex items-center space-x-2 border-b border-indigo-500/10 pb-2">
                  <i className="fa-solid fa-bolt"></i>
                  <span>AI 데이터 기반 전략적 인사이트</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.insights.map((insight, i) => (
                    <div key={i} className="flex items-start space-x-4 text-sm text-gray-300 print:text-black p-3 bg-white/5 rounded-lg border border-white/5 print:bg-transparent print:border-none print:p-0">
                      <span className="text-indigo-500 font-bold bg-indigo-500/10 w-6 h-6 flex items-center justify-center rounded text-[10px] shrink-0">{i+1}</span>
                      <p className="leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategies Section */}
              <div className="space-y-8 pb-12">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-xl font-bold text-white flex items-center space-x-3 print:text-black">
                    <i className="fa-solid fa-chess-knight text-indigo-500"></i>
                    <span>맞춤형 콘텐츠 로드맵 제안</span>
                  </h3>
                  <div className="flex items-center space-x-6 text-[10px] font-bold uppercase tracking-wider print:hidden">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-600 rounded shadow-sm"></div>
                      <span className="text-gray-400">대중적 (수요 위주)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded shadow-sm"></div>
                      <span className="text-gray-400">니치 (블루오션)</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {data.strategies.map((strategy, i) => (
                    <StrategyCard 
                      key={i} 
                      strategy={strategy} 
                      onRefresh={strategy.type === 'niche' ? () => handleRefreshNiche(i) : undefined}
                      refreshing={refreshingNicheId === i}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {!data && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
              <div className="relative">
                <div className="w-32 h-32 bg-indigo-600/5 rounded-full flex items-center justify-center animate-pulse">
                  <i className="fa-solid fa-magnifying-glass-chart text-5xl text-indigo-500/50"></i>
                </div>
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">READY</div>
              </div>
              <div className="max-w-md space-y-3">
                <h2 className="text-3xl font-bold text-white">데이터 분석을 시작하세요</h2>
                <p className="text-gray-400 leading-relaxed">
                  유튜브에서 공략하고 싶은 <span className="text-indigo-400 font-bold">주제(니치)</span>를 입력하세요.<br/>
                  AI가 실시간으로 트렌드와 수익성을 분석해 드립니다.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {['캠핑', '코딩 교육', '희귀 식물', '빈티지 게임'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => { setTopic(tag); handleAnalyze(); }}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 hover:text-white hover:border-indigo-500/50 transition-all active:scale-95"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar Right */}
        <aside className="w-80 border-l border-white/5 flex flex-col shrink-0 bg-[#0f0a1e] print:hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
            <h3 className="text-xs font-bold flex items-center space-x-2 text-gray-400">
              <i className="fa-solid fa-terminal text-indigo-500"></i>
              <span>AI AGENT ACTIVITY</span>
            </h3>
            <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase animate-pulse border border-green-500/20">LIVE</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-2 opacity-50">
                <i className="fa-solid fa-hourglass-start"></i>
                <span className="text-xs italic">시스템 대기 중...</span>
              </div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex flex-col space-y-1 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    log.type === 'success' ? 'text-green-500' : 
                    log.type === 'warning' ? 'text-amber-500' : 'text-indigo-400'
                  }`}>
                    {log.agent}
                  </span>
                  <span className="text-[10px] text-gray-700 font-mono">
                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                  log.type === 'success' ? 'bg-green-500/5 border-green-500/20 text-green-100/80' : 
                  log.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-100/80' : 
                  'bg-white/5 border-white/5 text-gray-300'
                }`}>
                  {log.message}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-white/2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-7 h-7 rounded-full border-2 border-[#0f0a1e] flex items-center justify-center text-[10px] font-bold shadow-lg ${i === 1 ? 'bg-indigo-600' : i === 2 ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                      <i className="fa-solid fa-robot"></i>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-gray-500 font-bold tracking-tighter">
                  3 AI AGENTS ONLINE
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"></div>
            </div>
          </div>
        </aside>
      </div>

      {/* Global CSS for Print */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 10pt; }
          .glass { background: white !important; border: 1px solid #eee !important; box-shadow: none !important; }
          .bg-indigo-950\\/20 { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
          .bg-white\\/5 { background: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; }
          button, .print\\:hidden, select, input { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:text-black { color: black !important; }
          .print\\:border-gray-200 { border-color: #e5e7eb !important; }
          .print\\:bg-white { background-color: white !important; }
          header, aside { display: none !important; }
          main { width: 100% !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; }
          .max-w-6xl { max-width: 100% !important; }
          h2, h3 { color: black !important; }
        }
      `}</style>
    </div>
  );
}
