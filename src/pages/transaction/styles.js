// contract 화면과 같은 모달·토스트 등장 애니메이션
export const FADE_IN_STYLE = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
`;
