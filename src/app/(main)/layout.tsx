import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ReactNode } from "react";

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col gap-16 h-dvh">
      <div className="flex flex-col gap-8 flex-1">
        <Header />
        <div className="mx-auto max-w-7xl p-4 w-full flex-1">{children}</div>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
