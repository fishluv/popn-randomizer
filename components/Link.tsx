import React from "react"

interface LinkProps {
  extraClass?: string
  href: string
  children: React.ReactNode
}

export default function Link({ extraClass, href, children }: LinkProps) {
  return (
    <a
      className={extraClass}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}
