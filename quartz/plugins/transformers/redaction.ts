import { QuartzTransformerPlugin } from "../types"
import { findAndReplace, FindAndReplaceTuple } from "mdast-util-find-and-replace"
import { Root, RootContent } from "mdast"

export const Redactions: QuartzTransformerPlugin = () => {
  return {
    name: "RedactedText",
    markdownPlugins() {
      return [
        () => (tree: Root) => {
          // 1. Handle Block Redactions
          if (tree.children) {
            const newChildren: RootContent[] = []
            let bufferedNodes: RootContent[] = []
            let isInsideBlock = false
            let currentStrategy = 'box'
            let currentReplacement = ''

            for (const node of tree.children) {
              const isParagraph = node.type === 'paragraph' && node.children.length > 0 && node.children[0].type === 'text'
              const text = isParagraph ? (node.children[0] as any).value.trim() as string : ''

              // Detect specific opener types
              const replaceMatch = text.match(/^§\{(.+?)}§$/)

              // Determine if this line is a marker
              let isOpener = false
              let isCloser = false
              let strategy = 'box'
              let replacement = ''

              if (isParagraph) {
                if (replaceMatch) {
                  isOpener = true
                  strategy = 'replace'
                  replacement = replaceMatch[1]
                } else if (text === '§h§') {
                  isOpener = true
                  strategy = 'hide'
                } else if (text === '§b§') {
                  isOpener = true
                  strategy = 'box'
                } else if (text === '§s§') {
                  isOpener = true
                  strategy = 'scramble'
                } else if (text === '§§') {
                  // §§ acts as a toggle: Open (default box) if outside, Close if inside
                  if (isInsideBlock) {
                    isCloser = true
                  } else {
                    isOpener = true
                    strategy = 'box'
                  }
                }
              }

              if (isCloser) {
                // Closing the block
                newChildren.push({
                  type: 'html',
                  value: `<div class="redacted block" data-strategy="${currentStrategy}" data-replacement="${currentReplacement}">`
                } as any)

                newChildren.push(...bufferedNodes)

                newChildren.push({
                  type: 'html',
                  value: '</div>'
                } as any)

                bufferedNodes = []
                isInsideBlock = false
              } else if (isOpener) {
                // Opening the block
                if (isInsideBlock) {
                  // Nesting not supported, treat as content or ignore
                  bufferedNodes.push(node)
                } else {
                  isInsideBlock = true
                  currentStrategy = strategy
                  currentReplacement = replacement
                }
              } else {
                // Not a marker
                if (isInsideBlock) {
                  bufferedNodes.push(node)
                } else {
                  newChildren.push(node)
                }
              }
            }

            // Append unclosed blocks
            if (isInsideBlock && bufferedNodes.length > 0) {
              newChildren.push(...bufferedNodes)
            }

            tree.children = newChildren
          }

          // 2. Handle Inline Redactions
          // We define multiple replacers. Order matters to avoid capturing subsets.
          findAndReplace(tree, [
            // Replace Strategy: §{Replacement}§content§§
            [
              /§\{(.+?)}§(.+?)§§/g,
              (_val: string, replacement: string, content: string) => ({
                type: 'html',
                value: `<span class="redacted" data-strategy="replace" data-replacement="${replacement}">${content}</span>`
              })
            ],
            // Hide Strategy: §h§content§§
            [
              /§h§(.+?)§§/g,
              (_val: string, content: string) => ({
                type: 'html',
                value: `<span class="redacted" data-strategy="hide">${content}</span>`
              })
            ],
            // Box Strategy (Explicit): §b§content§§
            [
              /§b§(.+?)§§/g,
              (_val: string, content: string) => ({
                type: 'html',
                value: `<span class="redacted" data-strategy="box">${content}</span>`
              })
            ],
            // Scramble Strategy: §s§content§§
            [
              /§s§(.+?)§§/g,
              (_val: string, content: string) => ({
                type: 'html',
                value: `<span class="redacted" data-strategy="scramble">${content}</span>`
              })
            ],
            // Box Strategy (Default): §§content§§
            [
              /§§(.+?)§§/g,
              (_val: string, content: string) => ({
                type: 'html',
                value: `<span class="redacted" data-strategy="box">${content}</span>`
              })
            ]
          ] as FindAndReplaceTuple[])
        }
      ]
    }
  }
}