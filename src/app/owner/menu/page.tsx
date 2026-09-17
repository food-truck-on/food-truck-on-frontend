import { BottomNav } from "@/components/BottomNav/BottomNav";
import { MenuScreen } from "@/features/owner/menu/MenuScreen";

export default function OwnerMenuPage() {
  return (
    <>
      <MenuScreen />
      <BottomNav current="menu" />
    </>
  );
}
