/**
 * 도움받을 곳 연락처. 하드코딩 대신 이 파일만 수정하면 화면에 반영된다.
 */
export interface Helpline {
  id: string;
  name: string;
  number: string;
  /** tel: 스킴에 들어갈 다이얼 문자열 (하이픈 없음) */
  dial: string;
  description: string;
  hours: string;
}

export const HELPLINES: Helpline[] = [
  {
    id: 'suicide-prevention',
    name: '자살예방상담전화',
    number: '109',
    dial: '109',
    description: '24시간, 익명으로 상담할 수 있어요.',
    hours: '24시간',
  },
  {
    id: 'mental-health-crisis',
    name: '정신건강위기상담전화',
    number: '1577-0199',
    dial: '15770199',
    description: '정신건강 위기 상황에서 전문가와 연결돼요.',
    hours: '24시간',
  },
];

export const MEDICAL_DISCLAIMER =
  '이 앱은 의료 서비스가 아니며 진단·치료를 대신하지 않습니다. 위급한 상황이라면 안내된 번호로 바로 연락해 주세요.';
