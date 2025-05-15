import { QuartzTransformerPlugin } from "../types"
import { Parent, Root } from "mdast"
import { visit } from "unist-util-visit"

/* The content could include other paragraphs, obsidian flavored markdown, other redactions or even
images. These are processed in another markdown plugin earlier in the pipeline.

The purpose of the markdown plugin should be only to mark where redactions should be placed and what
they contain. Determining if it should be shown and what is shown instead will be handled later by a
preact component on the client side.
*/

// https://gocardless.com/blog/fun-with-markdown-and-remark/
// Look into astro project to see how findAndReplace is used.


// redactions are marked with §integer as level§ content §§
const redactRegex = /§(\d+)§(.*?)§§/g

// markdown Plugin replaces the text with a custom "redaction" node that has the level and content as attributes
export const Redactions: QuartzTransformerPlugin = () => {
  return {
    name: "Redactions",
    markdownPlugins: () => [
      () => (tree: Root, _file) => {
        visit(tree, "text", (node) => {

          // TODO
        })
      },
    ],
    htmlPlugins: () => [],
  }
}


// Your custom node
export interface RedactionNode extends Parent {
  type: "redaction";
  redactionLevel: string;
  // 'children' is inherited from Parent
  data?: {
    hName?: string;
    hProperties?: { [key: string]: any };
  };
  value?: string; // The content of the redaction
}

// Augment the existing mdast types
declare module "mdast" {
  interface BlockContentMap {
    redaction: RedactionNode; // Allows 'redaction' as a block-level node
  }

  interface RootContentMap { // If it can be a top-level node
    redaction: RedactionNode;
  }

  // If you intend it to be inline (less likely for wrapping general content)
  interface PhrasingContentMap {
    redaction: RedactionNode;
  }
}
