import { BottomNav } from "@/components/BottomNav/BottomNav";
import { LocationScreen } from "@/features/owner/location/LocationScreen";

export default function OwnerLocationPage() {
  return (
    <>
      <LocationScreen />
      <BottomNav current="location" />
    </>
  );
}
