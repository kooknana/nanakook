import React, { useState, useCallback, useEffect } from 'react';
import { Project, Character, Page, GeneratedImage, ExaggerationLevel, PromptType, LogEntry } from './types';
import { analyzeStyle, generateImagesAB } from './services/imageGenerationService';

type AppView = 'setup' | 'pages' | 'preview';

// 초기 프로젝트 생성
function createEmptyProject(): Project {
  const emptyCharacters: Character[] = Array.from({ length: 5 }, (_, i) => ({
    id: `char-${i + 1}`,
    name: '',
    imageUrl: '',
    description: '',
    isEmpty: true,
  }));

  const emptyPages: Page[] = Array.from({ length: 30 }, (_, i) => ({
    pageNumber: i + 1,
    scenario: '',
    selectedCharacterIds: [],
    exaggerationLevel: 60 as ExaggerationLevel,
    userPrompt: '',
    generatedImages: [],
  }));

  return {
    id: crypto.randomUUID(),
    name: '새 동화 프로젝트',
    characters: emptyCharacters,
    styleProfile: null,
    pages: emptyPages,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// 캐릭터 슬롯 컴포넌트
const CharacterSlot: React.FC<{
  character: Character;
  onUpdate: (char: Character) => void;
}> = ({ character, onUpdate }) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdate({
          ...character,
          imageUrl: event.target?.result as string,
          isEmpty: false,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    onUpdate({
      ...character,
      name: '',
      imageUrl: '',
      description: '',
      isEmpty: true,
    });
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-purple-400">슬롯 {character.id.split('-')[1]}</h3>
        {!character.isEmpty && (
          <button
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            <i className="fa-solid fa-trash mr-1"></i>
            초기화
          </button>
        )}
      </div>

      {character.isEmpty ? (
        <label className="block cursor-pointer">
          <div className="w-full h-40 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center hover:border-purple-500/50 transition-all">
            <i className="fa-solid fa-image text-3xl text-gray-600 mb-2"></i>
            <span className="text-sm text-gray-500">이미지 업로드</span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
      ) : (
        <div className="space-y-3">
          <img
            src={character.imageUrl}
            alt={character.name}
            className="w-full h-40 object-cover rounded-lg"
          />
          <input
            type="text"
            placeholder="캐릭터 이름"
            value={character.name}
            onChange={(e) => onUpdate({ ...character, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
          <textarea
            placeholder="캐릭터 설명 (선택)"
            value={character.description}
            onChange={(e) => onUpdate({ ...character, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
            rows={2}
          />
        </div>
      )}
    </div>
  );
};

// 페이지 편집 컴포넌트
const PageEditor: React.FC<{
  page: Page;
  characters: Character[];
  styleProfile: any;
  onUpdate: (page: Page) => void;
  onGenerate: (pageNumber: number) => void;
  generating: boolean;
}> = ({ page, characters, styleProfile, onUpdate, onGenerate, generating }) => {
  const availableCharacters = characters.filter(c => !c.isEmpty);

  const toggleCharacter = (charId: string) => {
    const isSelected = page.selectedCharacterIds.includes(charId);
    const newIds = isSelected
      ? page.selectedCharacterIds.filter(id => id !== charId)
      : [...page.selectedCharacterIds, charId];
    onUpdate({ ...page, selectedCharacterIds: newIds });
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">페이지 {page.pageNumber}</h3>
        <button
          onClick={() => onGenerate(page.pageNumber)}
          disabled={!page.scenario || !styleProfile || generating}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-lg transition-all"
        >
          {generating ? (
            <>
              <i className="fa-solid fa-spinner animate-spin mr-2"></i>
              생성 중...
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
              이미지 생성
            </>
          )}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">시나리오</label>
        <textarea
          value={page.scenario}
          onChange={(e) => onUpdate({ ...page, scenario: e.target.value })}
          placeholder="이 페이지의 장면을 설명해주세요..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">등장 캐릭터</label>
        <div className="flex flex-wrap gap-2">
          {availableCharacters.map(char => (
            <button
              key={char.id}
              onClick={() => toggleCharacter(char.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                page.selectedCharacterIds.includes(char.id)
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {char.name}
            </button>
          ))}
          {availableCharacters.length === 0 && (
            <span className="text-sm text-gray-500">등록된 캐릭터가 없습니다</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">과장도</label>
        <div className="flex gap-3">
          {([40, 60, 80] as ExaggerationLevel[]).map(level => (
            <button
              key={level}
              onClick={() => onUpdate({ ...page, exaggerationLevel: level })}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                page.exaggerationLevel === level
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {level}%
              <div className="text-xs font-normal mt-1">
                {level === 40 ? '자연스러움' : level === 60 ? '동화적' : '극적'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          사용자 프롬프트 (선택)
        </label>
        <input
          type="text"
          value={page.userPrompt}
          onChange={(e) => onUpdate({ ...page, userPrompt: e.target.value })}
          placeholder="추가 지시사항을 입력하세요..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {page.generatedImages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">생성된 이미지</label>
          <div className="grid grid-cols-2 gap-4">
            {page.generatedImages.map(img => (
              <div key={img.id} className="space-y-2">
                <img
                  src={img.imageUrl}
                  alt={`Page ${page.pageNumber} - ${img.promptType}`}
                  className="w-full rounded-lg border border-white/10"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    프롬프트 {img.promptType} | {img.exaggerationLevel}%
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = img.imageUrl;
                        link.download = `page-${page.pageNumber}-${img.promptType}.png`;
                        link.click();
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      <i className="fa-solid fa-download"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [project, setProject] = useState<Project>(createEmptyProject());
  const [currentView, setCurrentView] = useState<AppView>('setup');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [
      { id: crypto.randomUUID(), message, timestamp: new Date(), type },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const updateCharacter = (index: number, char: Character) => {
    const newChars = [...project.characters];
    newChars[index] = char;
    setProject({ ...project, characters: newChars, updatedAt: new Date() });
  };

  const handleAnalyzeStyle = async () => {
    const filledCharacters = project.characters.filter(c => !c.isEmpty);
    if (filledCharacters.length === 0) {
      addLog('최소 1개의 캐릭터를 등록해주세요', 'error');
      return;
    }

    setAnalyzingStyle(true);
    addLog('캐릭터 이미지에서 스타일을 분석하고 있습니다...', 'info');

    try {
      const imageUrls = filledCharacters.map(c => c.imageUrl);
      const styleProfile = await analyzeStyle(imageUrls);
      setProject({ ...project, styleProfile, updatedAt: new Date() });
      addLog('스타일 분석 완료! 이제 페이지를 편집할 수 있습니다.', 'success');
      setCurrentView('pages');
    } catch (error) {
      addLog('스타일 분석 중 오류가 발생했습니다', 'error');
      console.error(error);
    } finally {
      setAnalyzingStyle(false);
    }
  };

  const updatePage = (pageNumber: number, page: Page) => {
    const newPages = [...project.pages];
    newPages[pageNumber - 1] = page;
    setProject({ ...project, pages: newPages, updatedAt: new Date() });
  };

  const handleGenerateImages = async (pageNumber: number) => {
    const page = project.pages[pageNumber - 1];
    if (!project.styleProfile || !page.scenario) return;

    setGenerating(true);
    addLog(`페이지 ${pageNumber} 이미지 생성 시작...`, 'info');

    try {
      const result = await generateImagesAB(
        project.styleProfile,
        project.characters,
        page.selectedCharacterIds,
        page.scenario,
        page.exaggerationLevel,
        page.userPrompt
      );

      const newImages: GeneratedImage[] = [
        {
          id: crypto.randomUUID(),
          imageUrl: result.imageUrlA,
          promptType: 'A' as PromptType,
          exaggerationLevel: page.exaggerationLevel,
          fullPrompt: result.promptA,
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          imageUrl: result.imageUrlB,
          promptType: 'B' as PromptType,
          exaggerationLevel: page.exaggerationLevel,
          fullPrompt: result.promptB,
          createdAt: new Date(),
        },
      ];

      updatePage(pageNumber, { ...page, generatedImages: newImages });
      addLog(`페이지 ${pageNumber} 이미지 생성 완료!`, 'success');
    } catch (error) {
      addLog(`페이지 ${pageNumber} 이미지 생성 실패`, 'error');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const renderSetupView = () => (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">
          <span className="text-purple-400">FairyPage</span> Studio
        </h1>
        <p className="text-gray-400">캐릭터와 스타일을 고정하고 30페이지 동화를 만들어보세요</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <input
          type="text"
          value={project.name}
          onChange={(e) => setProject({ ...project, name: e.target.value })}
          className="w-full bg-transparent border-none text-2xl font-bold text-white placeholder-gray-500 focus:outline-none"
          placeholder="프로젝트 이름"
        />
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">캐릭터 등록 (최대 5개)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.characters.map((char, idx) => (
            <CharacterSlot
              key={char.id}
              character={char}
              onUpdate={(c) => updateCharacter(idx, c)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleAnalyzeStyle}
          disabled={analyzingStyle || project.characters.filter(c => !c.isEmpty).length === 0}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all text-lg"
        >
          {analyzingStyle ? (
            <>
              <i className="fa-solid fa-spinner animate-spin mr-2"></i>
              스타일 분석 중...
            </>
          ) : (
            <>
              <i className="fa-solid fa-check mr-2"></i>
              스타일 고정 및 시작
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderPagesView = () => {
    const currentPage = project.pages[currentPageIndex];
    
    return (
      <div className="flex h-full">
        {/* 페이지 리스트 */}
        <div className="w-64 border-r border-white/10 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">페이지 목록</h3>
          <div className="space-y-2">
            {project.pages.map((page, idx) => (
              <button
                key={page.pageNumber}
                onClick={() => setCurrentPageIndex(idx)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  currentPageIndex === idx
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">페이지 {page.pageNumber}</span>
                  {page.generatedImages.length > 0 && (
                    <i className="fa-solid fa-check-circle text-green-500"></i>
                  )}
                </div>
                {page.scenario && (
                  <div className="text-xs mt-1 truncate opacity-70">
                    {page.scenario.substring(0, 30)}...
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 페이지 편집 */}
        <div className="flex-1 p-8 overflow-y-auto">
          <PageEditor
            page={currentPage}
            characters={project.characters}
            styleProfile={project.styleProfile}
            onUpdate={(p) => updatePage(currentPage.pageNumber, p)}
            onGenerate={handleGenerateImages}
            generating={generating}
          />
        </div>
      </div>
    );
  };

  const renderPreviewView = () => (
    <div className="max-w-6xl mx-auto space-y-8 p-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">{project.name}</h2>
        <p className="text-gray-400">전체 미리보기</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {project.pages.map(page => (
          <div key={page.pageNumber} className="space-y-2">
            <div className="aspect-[4/3] bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              {page.generatedImages.length > 0 ? (
                <img
                  src={page.generatedImages[0].imageUrl}
                  alt={`Page ${page.pageNumber}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <i className="fa-solid fa-image text-4xl"></i>
                </div>
              )}
            </div>
            <div className="text-center text-sm text-gray-400">
              페이지 {page.pageNumber}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#0a0015] via-[#1a0a2e] to-[#0a0015] text-white">
      {/* 헤더 */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-2xl">📚</div>
          <h1 className="text-lg font-bold">FairyPage Studio</h1>
        </div>

        <div className="flex items-center space-x-4">
          {currentView !== 'setup' && (
            <>
              <button
                onClick={() => setCurrentView('pages')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'pages'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <i className="fa-solid fa-book-open mr-2"></i>
                페이지 편집
              </button>
              <button
                onClick={() => setCurrentView('preview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'preview'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <i className="fa-solid fa-eye mr-2"></i>
                전체 미리보기
              </button>
            </>
          )}
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'setup' && (
          <div className="h-full overflow-y-auto p-8">
            {renderSetupView()}
          </div>
        )}
        {currentView === 'pages' && renderPagesView()}
        {currentView === 'preview' && (
          <div className="h-full overflow-y-auto">
            {renderPreviewView()}
          </div>
        )}
      </main>

      {/* 로그 패널 */}
      {logs.length > 0 && (
        <div className="fixed bottom-4 right-4 w-96 max-h-64 bg-black/90 border border-white/20 rounded-xl p-4 overflow-y-auto shadow-2xl">
          <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase">활동 로그</h3>
          <div className="space-y-2">
            {logs.slice(0, 5).map(log => (
              <div
                key={log.id}
                className={`text-xs p-2 rounded ${
                  log.type === 'success'
                    ? 'bg-green-500/10 text-green-400'
                    : log.type === 'error'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
