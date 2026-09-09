// 로컬 목업 모드 스위치.
// `.env.development` 의 VITE_USE_MOCK=true 일 때만 켜지며, API 호출 대신 목업 데이터를 사용한다.
// import.meta.env.DEV 를 함께 검사하므로 빌드 산출물(스테이징·운영)에서는 항상 꺼진다.
export const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === "true";
