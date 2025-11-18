import Link from "next/link"
import AuthLayout from "../../../components/AuthLayout"
import { Button } from "@/components/ui/button"

export default function ActivationPage() {
  return (
    <AuthLayout>
      <div className="w-full">
        <div className="space-y-1 text-left mb-6">
          <h1 className="text-xl font-extrabold">Email activado con éxito</h1>
          <p className="text-xs text-muted-foreground">
            Tu cuenta ha sido verificada correctamente. Ya puedes iniciar sesión.
          </p>
        </div>

        <div className="mt-6">
          <Button className="w-full" asChild>
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}