"use client"

import { useState } from 'react'
import { Spinner } from '@/components/ui/spinner'

export default function IframeWithPreloader({ src, title, className, ...props }) {
  const [isLoading, setIsLoading] = useState(true)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="size-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Cargando chats...</div>
          </div>
        </div>
      )}
      
      <iframe
        src={src}
        title={title}
        className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className || ''}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...props}
      />
    </div>
  )
}