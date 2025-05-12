import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"
import { visit } from "unist-util-visit"

/* The content could include other paragraphs, obsidian flavored markdown, other redactions or even
images. These are processed in another markdown plugin earlier in the pipeline.

The purpose of the markdown plugin should be only to mark where redactions should be placed and what
they contain. Determining if it should be shown and what is shown instead will be handled later by a
preact component on the client side.
*/


// redactions are marked with §integer as level§ content §§
const redactRegex = /§(\d+)§(.*?)§§/g

// markdown Plugin replaces the text with a custom "redaction" node that has the level and content as attributes
export const Redactions: QuartzTransformerPlugin = () => {
  return {
    "Redactions",
    markdownPlugins: () => [
      () => (tree: Root, _file) => {
        visit(tree, "text", (node) => {
          const { value } = node
          if (value) {

            // TODO

          }
        })
      },
    ],
    htmlPlugins: () => [],
  }
}
