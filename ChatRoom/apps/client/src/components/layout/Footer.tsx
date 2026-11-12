
import { PageContainer } from "../ui/PageContainer";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <PageContainer>
        <div className="flex flex-col items-center justify-between gap-2 py-5 text-center text-sm text-slate-500 sm:flex-row">
          <p>ChatRoom</p>
          <p>Simple, real-time conversations.</p>
        </div>
      </PageContainer>
    </footer>
  );
}
