import { useState } from "react";
import { fetchWeighingSlip } from "../api/weighingApi";

const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

// 계근표 PDF 내려받기. 계근 조회·거래관리에서 함께 쓴다.
// 한 번에 한 건만 받고, 오류는 { id, message }로 해당 계근에만 표시한다.
// 서버의 Content-Disposition은 CORS에 노출되지 않으므로 파일 이름은 호출하는 쪽에서 정한다.
export function useWeighingSlipDownload() {
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);

  const download = async (weighingRecordId, fileName) => {
    if (downloadingId != null) return;
    setDownloadingId(weighingRecordId);
    setError(null);
    try {
      saveBlob(await fetchWeighingSlip(weighingRecordId), fileName);
    } catch (downloadError) {
      setError({ id: weighingRecordId, message: downloadError.message || "계근표를 만들지 못했습니다." });
    } finally {
      setDownloadingId(null);
    }
  };

  return { downloadingId, error, download };
}
