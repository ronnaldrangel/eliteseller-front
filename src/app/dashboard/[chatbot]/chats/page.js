import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import IframeWithPreloader from "@/components/iframe-with-preloader"
import Image from "next/image"

export default function ChatsPage({ params }) {

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Accede a tus chats</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona todas las conversaciones con tus clientes y rendimiento del bot.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="w-full h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Image src="/images/chats/laptop.svg" width={64} height={64} alt="PC / Laptop" />
                  <div className="space-y-1">
                    <CardTitle>PC / Laptop</CardTitle>
                    <CardDescription>
                      Ahí puedes gestionar las conversaciones con tus clientes.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="mt-auto">
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

            {/* Tarjeta Apple */}
            <Card className="w-full h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Image src="/images/chats/apple.svg" width={64} height={64} alt="Apple" />
                  <div className="space-y-1">
                    <CardTitle>Apple</CardTitle>
                    <CardDescription>
                      Descarga la app en la App Store.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button className="w-full" asChild>
                  <Link
                    href="https://apps.apple.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir App Store
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Tarjeta Android */}
            <Card className="w-full h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Image src="/images/chats/android.svg" width={64} height={64} alt="Android" />
                  <div className="space-y-1">
                    <CardTitle>Android</CardTitle>
                    <CardDescription>
                      Descarga la app en Google Play.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button className="w-full" asChild>
                  <Link
                    href="https://play.google.com/store"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir Google Play
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
      </div>

    </div>
  );
}