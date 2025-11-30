// const text = isParagraph ? (node.children[0] as any).value.trim() as string : ''

import { QuartzTransformerPlugin } from "../types"
import { Root, RootContent, PhrasingContent } from "mdast"
import { visit } from "unist-util-visit"

// Regex to capture all markers
// Group 1: The specific marker found (e.g. "§b§", "§{...}§", "§§")
const TOKENIZER_REGEX = /(§[bhs]§|§\{.+?}§|§§)/g

export const Redactions: QuartzTransformerPlugin = () => {
  return {
    name: "RedactedText",
    markdownPlugins() {
      return [
        () => (tree: Root) => {

          // --- 1. Handle Block Redactions ---
          if (tree.children) {
            const newChildren: RootContent[] = []
            let bufferedNodes: RootContent[] = []
            let isInsideBlock = false
            let currentStrategy = 'box'
            let currentReplacement = ''

            for (const node of tree.children) {
              // Check if node is a Paragraph containing ONLY a marker
              const isParagraph = node.type === 'paragraph' && node.children.length === 1 && node.children[0].type === 'text'
              const text = isParagraph ? (node.children[0] as any).value.trim() as string : ''

              // Helper to detect marker type
              const isDefaultMarker = text === '§§'
              const replaceMatch = text.match(/^§\{(.+?)}§$/)
              const strategyMatch = text.match(/^§([bhs])§$/)

              let isOpener = false
              let isCloser = false
              let strategy = 'box'
              let replacement = ''

              if (isParagraph) {
                if (isInsideBlock && isDefaultMarker) {
                  isCloser = true
                } else if (!isInsideBlock && isDefaultMarker) {
                  isOpener = true
                  strategy = 'box'
                } else if (replaceMatch) {
                  isOpener = true
                  strategy = 'replace'
                  replacement = replaceMatch[1]
                } else if (strategyMatch) {
                  isOpener = true
                  if (strategyMatch[1] === 'b') strategy = 'box'
                  if (strategyMatch[1] === 'h') strategy = 'hide'
                  if (strategyMatch[1] === 's') strategy = 'scramble'
                }
              }

              if (isCloser) {
                newChildren.push({
                  type: 'html',
                  value: `<div class="redacted block" data-strategy="${currentStrategy}" data-replacement="${currentReplacement}">`
                } as any)
                newChildren.push(...bufferedNodes)
                newChildren.push({ type: 'html', value: '</div>' } as any)
                bufferedNodes = []
                isInsideBlock = false
              } else if (isOpener) {
                if (isInsideBlock) {
                  bufferedNodes.push(node) // Nested blocks not fully supported, treat as content
                } else {
                  isInsideBlock = true
                  currentStrategy = strategy
                  currentReplacement = replacement
                }
              } else {
                if (isInsideBlock) {
                  bufferedNodes.push(node)
                } else {
                  newChildren.push(node)
                }
              }
            }
            // Flush unclosed blocks
            if (bufferedNodes.length > 0) newChildren.push(...bufferedNodes)

            tree.children = newChildren
          }


          // --- 2. Handle Inline Redactions (Spans) ---
          // We visit parents of phrasing content (Paragraphs, Headings, etc)
          visit(tree, (node: any) => {
            if (!node.children || node.children.length === 0) return

            const newChildren: PhrasingContent[] = []
            let buffer: PhrasingContent[] = []
            let activeStrategy: string | null = null
            let activeReplacement = ''

            for (const child of node.children) {
              if (child.type === 'text') {
                // Split the text node by our markers
                // "Hello §§ world" -> ["Hello ", "§§", " world"]
                const parts = child.value.split(TOKENIZER_REGEX)

                for (const part of parts) {
                  if (!part) continue // Skip empty splits

                  // Check if part is a marker
                  const replaceMatch = part.match(/^§\{(.+?)}§$/)
                  const strategyMatch = part.match(/^§([bhs])§$/)
                  const isDefaultMarker = part === '§§'

                  if (isDefaultMarker || replaceMatch || strategyMatch) {
                    // Logic: If we have an active strategy, '§§' is a closer.
                    // Anything else is a new opener (nesting not supported, so we restart or ignore)

                    if (activeStrategy && isDefaultMarker) {
                      // --- CLOSE ---
                      const wrapper: any = {
                        type: 'html',
                        value: `<span class="redacted" data-strategy="${activeStrategy}" data-replacement="${activeReplacement}">`
                      }
                      const closing: any = { type: 'html', value: '</span>' }

                      newChildren.push(wrapper)
                      newChildren.push(...buffer)
                      newChildren.push(closing)

                      buffer = []
                      activeStrategy = null
                      activeReplacement = ''
                    } else {
                      // --- OPEN ---
                      // If we were already open, we essentially treat the previous content as unclosed text (or you could choose to nest)
                      // For simplicity, let's treat it as a restart or plain text.
                      // Here, if we are already open and see a specific opener like §b§, we treat it as text inside the redaction.
                      if (activeStrategy) {
                        buffer.push({ type: 'text', value: part })
                      } else {
                        // Start new redaction
                        if (replaceMatch) {
                          activeStrategy = 'replace'
                          activeReplacement = replaceMatch[1]
                        } else if (strategyMatch) {
                          if (strategyMatch[1] === 'b') activeStrategy = 'box'
                          if (strategyMatch[1] === 'h') activeStrategy = 'hide'
                          if (strategyMatch[1] === 's') activeStrategy = 'scramble'
                        } else {
                          activeStrategy = 'box'
                        }
                      }
                    }
                  } else {
                    // --- PLAIN TEXT ---
                    if (activeStrategy) {
                      buffer.push({ type: 'text', value: part })
                    } else {
                      newChildren.push({ type: 'text', value: part })
                    }
                  }
                }
              } else {
                // --- NON-TEXT NODE (Emphasis, Strong, Link, etc.) ---
                if (activeStrategy) {
                  buffer.push(child)
                } else {
                  newChildren.push(child)
                }
              }
            }

            // Append any unclosed buffer as normal nodes (fail safe)
            if (buffer.length > 0) {
              // Optionally: You could auto-close it here if you wanted
              newChildren.push(...buffer)
            }

            node.children = newChildren
          })
        }
      ]
    }
  }
}