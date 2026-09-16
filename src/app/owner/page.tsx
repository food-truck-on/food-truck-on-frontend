import { BottomNav } from "@/components/BottomNav/BottomNav";
import { RoutePlaceholder } from "@/components/RoutePlaceholder/RoutePlaceholder";

export default function OwnerHomePage() {
  return (
    <>
      <RoutePlaceholder
        path="/owner"
        title="사장님 홈"
        note="로그인 필수. 상단에 설정 아이콘, 링크 공유 옆에 '내 가게 페이지 미리보기' 버튼(/t/:slug, 내 트럭만)이 들어온다"
      />
      <BottomNav current="home" />
    </>
  );
}
