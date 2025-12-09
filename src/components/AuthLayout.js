"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";

const AuthLayout = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleVideoError = () => {
    setVideoFailed(true);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background pt-[var(--topbar-offset)]">
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        {mounted && (
          <Image
            src={
              resolvedTheme === "dark"
                ? "/images/background/auth-dark.webp"
                : "/images/background/auth-light.webp"
            }
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 grid min-h-[calc(100vh-var(--topbar-offset))] grid-cols-1 md:grid-cols-2 w-full">
        {/* Left Side - Login Form */}
        <div className="flex flex-col justify-center p-4 md:p-8 h-full">
          <Card className="w-full h-full border-border/50 bg-background flex flex-col justify-center">
            <CardContent className="pt-4 w-full max-w-2xl mx-auto flex flex-col justify-center h-full">

              <div className="mb-6 flex">
                <Link href="https://eliteseller.app/" className="block">
                  {mounted ? (
                    <Image
                      src={
                        resolvedTheme === "dark"
                          ? "/images/logo-white.png"
                          : "/images/logo-black.png"
                      }
                      alt="Logo"
                      width={140}
                      height={24}
                      priority
                      className="h-8 w-auto"
                    />
                  ) : (
                    <div className="h-10 w-36 bg-muted rounded animate-pulse"></div>
                  )}
                </Link>
              </div>

              <main className="w-full">{children}</main>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Image Content */}
        <div className="hidden md:flex items-center justify-center p-8">
          <Card className="w-full max-w-xl border-none bg-transparent shadow-none">
            <CardContent className="p-0 flex justify-center">
              <Image
                src="/images/background/image.png"
                alt="Auth illustration"
                width={600}
                height={600}
                className="w-full h-auto object-contain animate-float"
                priority
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;