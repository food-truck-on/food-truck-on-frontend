import { BottomNav } from "@/components/BottomNav/BottomNav";
import { HomeScreen } from "@/features/owner/home/HomeScreen";

export default function OwnerHomePage() {
  return (
    <>
      <HomeScreen />
      <BottomNav current="home" />
    </>
  );
}
