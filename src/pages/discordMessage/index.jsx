import Button from "../../components/Button";
import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import Toast from "../contract/components/Toast";
import MessageList from "./components/MessageList";
import SendResultPanel from "./components/SendResultPanel";
import { useDiscordMessageList } from "./hooks/useDiscordMessageList";

export default function DiscordMessagePage() {
  const { toast, onCreate, list, sendResult } = useDiscordMessageList();

  return (
    <>
      <PageContainer>
        <PageHeader
          title="디스코드 메시지"
          description="지정한 요일·시각부터 10분 안에 하루 한 번 발송됩니다. 수정 내용은 다음 발송부터 적용됩니다."
          actions={<Button onClick={onCreate}>새 메시지</Button>}
        />

        <SendResultPanel {...sendResult} />
        <MessageList {...list} />
      </PageContainer>

      <Toast toast={toast} />
    </>
  );
}
