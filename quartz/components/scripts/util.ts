import { QuartzComponentProps, users } from "../types"
import { QuartzPluginData } from "../../plugins/vfile"

export function registerEscapeHandler(outsideContainer: HTMLElement | null, cb: () => void) {
  if (!outsideContainer) return

  function click(this: HTMLElement, e: HTMLElementEventMap["click"]) {
    if (e.target !== this) return
    e.preventDefault()
    e.stopPropagation()
    cb()
  }

  function esc(e: HTMLElementEventMap["keydown"]) {
    if (!e.key.startsWith("Esc")) return
    e.preventDefault()
    cb()
  }

  outsideContainer?.addEventListener("click", click)
  window.addCleanup(() => outsideContainer?.removeEventListener("click", click))
  document.addEventListener("keydown", esc)
  window.addCleanup(() => document.removeEventListener("keydown", esc))
}

export function removeAllChildren(node: HTMLElement) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

export function parseComponentData(targetDocument?: Document): QuartzPluginData | null {
  let currDocument = document
  if (targetDocument) {
    currDocument = targetDocument
  }

  const componentDataElement = currDocument.getElementById("protected-content-data")
  if (!componentDataElement?.textContent) {
    return null
  }
  const data = JSON.parse(componentDataElement.textContent) as QuartzComponentProps
  return data.fileData
}

export function isAuthorized(user: string, arg2: QuartzPluginData | string): boolean {
  const adminUsers = users.filter((u) => u.role === "admin").map((u) => u.username)

  let allowedUsersString: string
  if (typeof arg2 === "string") {
    allowedUsersString = arg2
  } else {
    const frontmatterAllowedUsers = arg2.frontmatter?.allowedUsers
    if (Array.isArray(frontmatterAllowedUsers)) {
      allowedUsersString = frontmatterAllowedUsers.join(",")
    } else {
      allowedUsersString = frontmatterAllowedUsers as string ?? ""
    }
  }

  // early exit if no allowed users, but user is admin
  if (allowedUsersString === "") {
    return adminUsers.includes(user)
  }

  const allowedUsers = allowedUsersString.split(",").map((u) => u.trim().toLowerCase())

  if (allowedUsers.includes("all")) return true
  if (!user) return false
  if (adminUsers.includes(user)) return true
  return allowedUsers.includes(user)
}

// make another version of the isAuthorized version that checks the elevatedUsers frontmatter field
export function isElevated(user: string, arg2: QuartzPluginData | string): boolean {
  const adminUsers = users.filter((u) => u.role === "admin").map((u) => u.username)

  let elevatedUsersString: string
  if (typeof arg2 === "string") {
    elevatedUsersString = arg2
  } else {
    const frontmatterElevatedUsers = arg2.frontmatter?.elevatedUsers
    if (Array.isArray(frontmatterElevatedUsers)) {
      elevatedUsersString = frontmatterElevatedUsers.join(",")
    } else {
      elevatedUsersString = frontmatterElevatedUsers as string ?? ""
    }
  }

  // early exit if no elevated users, but user is admin
  if (elevatedUsersString === "") {
    return adminUsers.includes(user)
  }

  const elevatedUsers = elevatedUsersString.split(",").map((u) => u.trim().toLowerCase())

  if (elevatedUsers.includes("all")) return true
  if (!user) return false
  if (adminUsers.includes(user)) return true
  return elevatedUsers.includes(user)
}



export function getUser() {
  return localStorage.getItem("username")
}
