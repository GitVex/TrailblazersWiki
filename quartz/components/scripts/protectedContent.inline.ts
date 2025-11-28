import { getUser, isAuthorized, isElevated, parseComponentData } from "./util"

function applyRedactions() {
  // Find all elements marked by the transformer
  const elements = document.querySelectorAll(".redacted")

  elements.forEach((el) => {
    // Avoid double-redacting if the script runs multiple times
    if (el.getAttribute("data-redacted") === "true") return

    // Determine strategy
    const strategy = el.getAttribute("data-strategy") || "box"

    if (strategy === "hide") {
      // Option 1: Completely remove from layout
      ;(el as HTMLElement).style.display = "none"
    } else if (strategy === "replace") {
      // Option 2: Replace content with custom text
      el.textContent = el.getAttribute("data-replacement") || "[REDACTED]"
      // Clear styles that might look like a black box
      el.removeAttribute("style")
    } else if (strategy === "scramble") {
      // Option 3: Scramble text animation
      const element = el as HTMLElement

      // 1. Lock the width to prevent jittering as characters move
      const currentWidth = element.getBoundingClientRect().width
      if (currentWidth > 0) {
        element.style.width = `${currentWidth}px`
        element.style.display = 'inline-block'
        element.style.textAlign = 'center' // Keep text centered in the fixed box
      }

      // 2. Ensure the text is visible (override the .redacted CSS)
      element.style.color = 'inherit'
      element.style.backgroundColor = 'transparent'

      startScrambling(element)
    } else {
      // Option 4: Default Box Redaction
      obfuscateNode(el)
    }

    // Mark as processed so we don't do it again
    el.setAttribute("data-redacted", "true")
  })
}

function startScrambling(element: Element) {
  // Helper to collect text nodes so we don't re-traverse every 500ms
  const textNodes: Node[] = []

  const collectText = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Only track nodes that actually have text to avoid jittering empty spaces
      if (node.textContent && node.textContent.trim().length > 0) {
        textNodes.push(node)
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Disable links inside scrambled content
      if ((node as Element).tagName === "A") {
        ;(node as Element).removeAttribute("href")
        ;(node as Element).setAttribute("style", "cursor: default; text-decoration: none;")
      }
      node.childNodes.forEach(collectText)
    }
  }

  collectText(element)

  // Update every 500ms
  const intervalId = setInterval(() => {
    // Cleanup: Stop if element is removed from DOM (e.g. page navigation)
    if (!document.body.contains(element)) {
      clearInterval(intervalId)
      return
    }

    textNodes.forEach((node) => {
      const current = node.textContent || ""
      // Simple shuffle
      node.textContent = current
        .split("")
        .sort(() => 0.5 - Math.random())
        .join("")
    })
  }, 100)
}

function obfuscateNode(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || ""
    // Replace every non-whitespace character with a block character
    node.textContent = text.replace(/\S/g, "█")
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element

    // Disable links inside redactions so users can't click "hidden" links
    if (element.tagName === "A") {
      element.removeAttribute("href")
      element.setAttribute("title", "Redacted Link")
      element.setAttribute("style", "cursor: not-allowed; text-decoration: none; color: inherit;")
    }

    // Recursively handle children (e.g., bold/italic inside a redaction block)
    node.childNodes.forEach((child) => obfuscateNode(child))
  }
}

function auth() {
  // Get unauthorized and authorized elements
  const unauthorized = document.getElementById("protected-content-unauthorized")
  const authorized = document.getElementById("protected-content-authorized")
  if (!unauthorized || !authorized) {
    // console.warn("Could not find protected-content-unauthorized or protected-content-authorized")
    return
  }

  if (!unauthorized || !authorized) {
    applyRedactions()
    return
  }

  const user = getUser() ?? ""
  const parsedComponentData = parseComponentData() ?? ""

  if (isAuthorized(user, parsedComponentData)) {
    unauthorized.style.display = "none"
    authorized.style.display = "block"

    if (!isElevated(user, parsedComponentData)) {
      applyRedactions()
    }
  } else {
    unauthorized.style.display = "block"
    authorized.style.display = "none"
  }
}

document.addEventListener("nav", () => auth())
// window.addCleanup(() => document.removeEventListener("nav", () => auth()))
