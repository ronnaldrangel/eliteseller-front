"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function OnboardingPopup({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Check localStorage only on client side
    // const hasSeen = localStorage.getItem("hasSeenOnboarding");
    // if (!hasSeen) {
      setIsOpen(true);
    // }
    setHasChecked(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
  };

  const handleNavigation = () => {
    handleClose();
    onNavigate("tutorials");
  };

  if (!hasChecked) return null; // Avoid hydration mismatch

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-primary/10 p-2">
                 <Image
                    src="/images/bot.webp"
                    alt="Robot"
                    fill
                    className="object-contain"
                />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">¡Bienvenido a EliteSeller!</DialogTitle>
           <DialogDescription className="text-center text-md pt-2">
            Hemos preparado unos videos para ti. Explora nuestra nueva sección de tutoriales para sacar el máximo provecho de tu dashboard.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row sm:justify-center gap-2 mt-4">
          <Button variant="ghost" className="sm:w-auto w-full" onClick={handleClose}>
            Más tarde
          </Button>
          <Button className="sm:w-auto w-full" onClick={handleNavigation}>
            Ver Tutoriales
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
