import { useState } from "react";
import { fetchWeighingSlip } from "../api/weighingApi";

const slipFileNameOf = (weighing) =>
  `계근표_${weighing.weighedAt}_${String(weighing.dailySequence ?? "").padStart(4, "0")}.pdf`;

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

// 계근표 PDF 내려받기. 한 번에 한 건만 받고, 오류는 해당 계근에만 표시한다.
export function useWeighingSlipDownload() {
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);

  const download = async (weighing) => {
    if (downloadingId != null) return;
    setDownloadingId(weighing.id);
    setError(null);
    try {
      saveBlob(await fetchWeighingSlip(weighing.id), slipFileNameOf(weighing));
    } catch (downloadError) {
      setError({ id: weighing.id, message: downloadError.message || "계근표를 만들지 못했습니다." });
    } finally {
      setDownloadingId(null);
    }
  };

  return { downloadingId, error, download };
}
