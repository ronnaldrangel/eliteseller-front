import Image from "next/image"
import Link from "next/link"
import SelectUserAvatarMenu from "@/components/select-user-avatar-menu"

export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen w-full pt-[var(--topbar-offset)]">
      <div className="mx-auto max-w-6xl px-4 lg:px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/select" className="block" aria-label="Inicio">
              <span className="inline-flex items-center">
                <Image
                  src="/images/logo-black.png"
                  alt="Logo"
                  width={140}
                  height={24}
                  priority
                  className="h-8 w-auto dark:hidden"
                />
                <Image
                  src="/images/logo-white.png"
                  alt="Logo"
                  width={140}
                  height={24}
                  priority
                  className="hidden h-8 w-auto dark:block"
                />
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <SelectUserAvatarMenu />
          </div>
        </div>

        <div className="mt-8">
          {children}
        </div>
      </div>
    </div>
  )
}