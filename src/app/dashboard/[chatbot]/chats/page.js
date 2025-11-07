import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import IframeWithPreloader from "@/components/iframe-with-preloader"

export default function ChatsPage({ params }) {

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">

        <div className="flex flex-col">
          <div className="p-4">
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle>Accede a tus chats</CardTitle>
                <CardDescription>
                  Ahí puedes gestionar las conversaciones con tus clientes.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link
                    href="/api/crm/login?redirect=1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir chats
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}