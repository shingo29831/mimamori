import '@/../css/globals.css'
import React, { ReactNode } from 'react'


type LayoutProps = {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="font-sans bg-background text-foreground min-h-screen">
      {children}
    </div>
  )
}

export default Layout