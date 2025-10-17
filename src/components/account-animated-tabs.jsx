"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AccountProfileForm from "@/components/account-profile-form";
import AccountPasswordForm from "@/components/account-password-form";
import { motion, AnimatePresence } from "framer-motion";

export default function AccountAnimatedTabs({
  displayName,
  displayEmail,
  initials,
  providerLabel,
  gravatarUrl,
  initialName,
  initialPhone,
}) {
  return (
    <Tabs defaultValue="perfil" className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
        <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
      </TabsList>

      <div className="mt-2 p-4 border rounded-md">
        <TabsContent value="perfil">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="space-y-4"
            >
              <div className="mb-4 md:mb-6">
                <div className="flex items-start gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={gravatarUrl} alt={displayEmail || displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tracking-tight leading-none">{displayName}</span>
                      <span className="text-xs rounded-md border px-2 py-0.5 text-muted-foreground">{providerLabel}</span>
                    </div>
                    <span className="leading-none text-sm text-muted-foreground">
                      {displayEmail}
                    </span>
                  </div>
                </div>
              </div>
              <h2 className="text-lg font-semibold">Editar perfil</h2>
              <p className="text-sm text-muted-foreground">Actualiza tu nombre y teléfono.</p>
              <AccountProfileForm initialName={initialName} initialPhone={initialPhone} />
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="seguridad">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
              <p className="text-sm text-muted-foreground">Introduce tu contraseña actual y la nueva.</p>
              <AccountPasswordForm />
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </div>
    </Tabs>
  );
}