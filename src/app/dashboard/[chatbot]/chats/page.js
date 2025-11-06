import { Button } from "@/components/ui/button"
import Link from "next/link"
import IframeWithPreloader from "@/components/iframe-with-preloader"

export default function ChatsPage({ params }) {

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">

        <div className="flex flex-col">


          <div className="relative w-full h-[calc(100vh)]">
            <IframeWithPreloader
              src="https://crm.eliteseller.app/"
              title="Chats embebidos"
              className="w-full h-full"
            />
          </div>

          <div className="p-4">
            <Button asChild>
              <Link href="/api/crm/login?redirect=1" target="_blank" rel="noopener noreferrer">
                Accede a tus chats
              </Link>
            </Button>

          </div>

        </div>
      </div>
    </div>
  );
}