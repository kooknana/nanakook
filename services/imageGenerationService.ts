import { Character, StyleProfile, ExaggerationLevel, PromptType } from '../types';

/**
 * 스타일 분석: 캐릭터 이미지에서 스타일 프로필 생성
 */
export async function analyzeStyle(characterImages: string[]): Promise<StyleProfile> {
  // TODO: 실제 이미지 분석 API 호출
  // 임시로 더미 데이터 반환
  const stylePrompt = "Digital illustration, soft watercolor style, pastel colors, children's book aesthetic, gentle lighting, warm tones";
  
  return {
    id: crypto.randomUUID(),
    stylePrompt,
    referenceImageUrl: characterImages[0],
    createdAt: new Date(),
  };
}

/**
 * 프롬프트 조립: 스타일 + 캐릭터 + 장면 + 과장도 + 구도
 */
export function buildPrompt(
  styleProfile: StyleProfile,
  characters: Character[],
  selectedCharacterIds: string[],
  scenario: string,
  exaggerationLevel: ExaggerationLevel,
  promptType: PromptType,
  userPrompt?: string
): string {
  const selectedChars = characters.filter(c => selectedCharacterIds.includes(c.id) && !c.isEmpty);
  
  // 1. 스타일 고정
  let prompt = `Style: ${styleProfile.stylePrompt}. `;
  
  // 2. 캐릭터 고정
  if (selectedChars.length > 0) {
    const charDescriptions = selectedChars.map((char, idx) => 
      `CHARACTER_${idx + 1}: ${char.name}${char.description ? `, ${char.description}` : ''}`
    ).join(', ');
    prompt += `Characters: ${charDescriptions}. `;
  }
  
  // 3. 장면 요약
  const sceneText = userPrompt || scenario;
  prompt += `Scene: ${sceneText}. `;
  
  // 4. 표정·행동 강조
  prompt += `Focus on facial expressions and body language. `;
  
  // 5. 과장도
  const exaggerationMap = {
    40: 'Natural and subtle emotions',
    60: 'Expressive fairy-tale style reactions',
    80: 'Highly dramatic and comedic expressions',
  };
  prompt += `Emotion intensity: ${exaggerationMap[exaggerationLevel]}. `;
  
  // 6. 구도 (A/B)
  if (promptType === 'A') {
    prompt += 'Composition: Medium shot, centered, balanced framing.';
  } else {
    prompt += 'Composition: Wide shot, dynamic angle, environmental context.';
  }
  
  return prompt;
}

/**
 * 이미지 생성 API 호출
 */
export async function generateImage(
  fullPrompt: string,
  styleReferenceUrl: string,
  characterReferenceUrls: string[]
): Promise<string> {
  try {
    // TODO: 실제 이미지 생성 API (ideogram/V_3) 호출
    // image_generation 툴을 사용해야 함
    
    // 임시: 플레이스홀더 이미지 반환
    const placeholderUrl = `https://via.placeholder.com/1024x768.png?text=${encodeURIComponent('Generated Image')}`;
    
    console.log('Generating image with prompt:', fullPrompt);
    console.log('Style reference:', styleReferenceUrl);
    console.log('Character references:', characterReferenceUrls);
    
    // 실제 구현 시:
    // const result = await image_generation({
    //   query: fullPrompt,
    //   image_urls: [styleReferenceUrl, ...characterReferenceUrls],
    //   model: 'ideogram/V_3',
    //   aspect_ratio: '4:3',
    //   task_summary: 'Generate fairy tale illustration with fixed style and characters'
    // });
    
    return placeholderUrl;
  } catch (error) {
    console.error('Image generation failed:', error);
    throw new Error('Failed to generate image');
  }
}

/**
 * A/B 프롬프트 생성 및 이미지 생성
 */
export async function generateImagesAB(
  styleProfile: StyleProfile,
  characters: Character[],
  selectedCharacterIds: string[],
  scenario: string,
  exaggerationLevel: ExaggerationLevel,
  userPrompt?: string
): Promise<{ promptA: string; promptB: string; imageUrlA: string; imageUrlB: string }> {
  const promptA = buildPrompt(
    styleProfile,
    characters,
    selectedCharacterIds,
    scenario,
    exaggerationLevel,
    'A',
    userPrompt
  );
  
  const promptB = buildPrompt(
    styleProfile,
    characters,
    selectedCharacterIds,
    scenario,
    exaggerationLevel,
    'B',
    userPrompt
  );
  
  const selectedChars = characters.filter(c => selectedCharacterIds.includes(c.id) && !c.isEmpty);
  const characterReferenceUrls = selectedChars.map(c => c.imageUrl);
  
  // 병렬 생성
  const [imageUrlA, imageUrlB] = await Promise.all([
    generateImage(promptA, styleProfile.referenceImageUrl, characterReferenceUrls),
    generateImage(promptB, styleProfile.referenceImageUrl, characterReferenceUrls),
  ]);
  
  return { promptA, promptB, imageUrlA, imageUrlB };
}
