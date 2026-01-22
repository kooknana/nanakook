// Character Slot (최대 5개)
export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  isEmpty: boolean;
}

// 스타일 프로필
export interface StyleProfile {
  id: string;
  stylePrompt: string; // AI가 분석한 스타일 프롬프트
  referenceImageUrl: string;
  createdAt: Date;
}

// 과장도 타입
export type ExaggerationLevel = 40 | 60 | 80;

// 프롬프트 A/B 타입
export type PromptType = 'A' | 'B';

// 생성된 이미지
export interface GeneratedImage {
  id: string;
  imageUrl: string;
  promptType: PromptType;
  exaggerationLevel: ExaggerationLevel;
  fullPrompt: string;
  createdAt: Date;
}

// 페이지 (1-30)
export interface Page {
  pageNumber: number;
  scenario: string; // 시나리오 텍스트
  selectedCharacterIds: string[]; // 등장 캐릭터 ID 리스트
  exaggerationLevel: ExaggerationLevel;
  userPrompt?: string; // 사용자 커스텀 프롬프트
  generatedImages: GeneratedImage[]; // 생성된 이미지들
}

// 프로젝트
export interface Project {
  id: string;
  name: string;
  characters: Character[]; // 최대 5개
  styleProfile: StyleProfile | null;
  pages: Page[]; // 30페이지 고정
  createdAt: Date;
  updatedAt: Date;
}

// 로그 엔트리
export interface LogEntry {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}
