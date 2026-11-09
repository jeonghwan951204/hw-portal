import Button from "../../components/Button";
import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import ItemDeleteModal from "./components/ItemDeleteModal";
import ItemFormModal from "./components/ItemFormModal";
import ItemList from "./components/ItemList";
import ItemToolbar from "./components/ItemToolbar";
import { useItemList } from "./hooks/useItemList";

export default function ItemsPage() {
  const { toolbar, list, formModal, deleteModal, onCreate } = useItemList();

  return (
    <>
      <PageContainer>
        <PageHeader
          title="품목관리"
          description="거래에 사용하는 품목과 별칭을 관리합니다."
          actions={<Button onClick={() => onCreate()}>품목 등록</Button>}
        />

        <ItemToolbar {...toolbar} />
        <ItemList {...list} />
      </PageContainer>

      <ItemFormModal {...formModal} />
      <ItemDeleteModal {...deleteModal} />
    </>
  );
}
